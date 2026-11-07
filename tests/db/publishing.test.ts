import { beforeAll, describe, expect, it } from "vitest";
import { buildDraftDocument, type WebsiteDraft } from "@/features/websites/document";
import { assignRole, createTestDb, createUser, queryAs, type TestDb } from "./setup";

// Publishing, custom domains, visitor analytics and plans: the features that used to
// be "coming soon" in the dashboard.

let db: TestDb;
let alice: string;
let bob: string;
let billing: string;

const create = async (user: string, slug: string) =>
  (
    await queryAs<{ id: string }>(
      db,
      user,
      `select public.create_website(p_theme_slug => 'hearth', p_name => 'My Site', p_slug => $1, p_category_slug => 'cafe') as id`,
      [slug],
    )
  ).rows[0]!.id;

const site = async (slug: string) =>
  (await queryAs<{ site: { slug: string; version: number; snapshot: WebsiteDraft } | null }>(db, null, `select public.get_published_site($1) as site`, [slug])).rows[0]!.site;

const publish = (user: string, id: string) => queryAs<{ result: { version: number } }>(db, user, `select public.publish_website($1) as result`, [id]);

beforeAll(async () => {
  db = await createTestDb();
  alice = await createUser(db, "alice@example.test");
  bob = await createUser(db, "bob@example.test");
  billing = await createUser(db, "billing@example.test");
  await assignRole(db, billing, "super_admin");
}, 120_000);

describe("publishing", () => {
  it("keeps a new website private until it is published", async () => {
    const id = await create(alice, "alice-bakery");
    expect(await site("alice-bakery")).toBeNull();
    const { rows } = await publish(alice, id);
    expect(rows[0]!.result.version).toBe(1);
    const live = await site("alice-bakery");
    expect(live?.version).toBe(1);
    // The snapshot is a full draft that renders with the theme.
    expect(buildDraftDocument(live!.snapshot)?.pages.length).toBeGreaterThan(0);
  });

  it("serves the published version, not later draft edits, until the next publish", async () => {
    const id = await create(alice, "alice-studio");
    await publish(alice, id);
    await queryAs(db, alice, `update public.websites set name = 'Renamed draft' where id = $1`, [id]);
    expect((await site("alice-studio"))!.snapshot.name).toBe("My Site");
    await publish(alice, id);
    const live = await site("alice-studio");
    expect(live!.version).toBe(2);
    expect(live!.snapshot.name).toBe("Renamed draft");
  });

  it("takes a site offline when unpublished and brings it back on publish", async () => {
    const id = await create(alice, "alice-offline");
    await publish(alice, id);
    await queryAs(db, alice, `select public.unpublish_website($1)`, [id]);
    expect(await site("alice-offline")).toBeNull();
    await expect(queryAs(db, alice, `select public.unpublish_website($1)`, [id])).rejects.toThrow(/not published/);
    await publish(alice, id);
    expect(await site("alice-offline")).not.toBeNull();
  });

  it("refuses other people, signed-out visitors and suspended websites", async () => {
    const id = await create(alice, "alice-private");
    await expect(publish(bob, id)).rejects.toThrow(/not found/);
    await expect(queryAs(db, null, `select public.publish_website($1)`, [id])).rejects.toThrow();
    await expect(queryAs(db, bob, `select public.unpublish_website($1)`, [id])).rejects.toThrow(/not found/);
    await db.query(`update public.websites set status = 'suspended' where id = $1`, [id]);
    await expect(publish(alice, id)).rejects.toThrow(/suspended/);
  });

  it("still blocks owners from setting the published state directly", async () => {
    const id = await create(alice, "alice-direct");
    await expect(queryAs(db, alice, `update public.websites set status = 'published' where id = $1`, [id])).rejects.toThrow(/publishing state/);
  });

  it("records each publish in the activity log", async () => {
    const result = await db.query<{ count: number }>(`select count(*)::int as count from public.activity_logs where action = 'website.publish' and actor_id = $1`, [alice]);
    expect(result.rows[0]!.count).toBeGreaterThan(0);
  });
});

describe("custom domains", () => {
  let id: string;
  const add = (user: string, hostname: string, website = id) =>
    queryAs(db, user, `insert into public.website_domains (website_id, hostname) values ($1, $2)`, [website, hostname]);

  beforeAll(async () => {
    id = await create(alice, "alice-domains");
    await publish(alice, id);
  });

  it("lets the owner request a domain, which stays pending", async () => {
    await add(alice, "www.alicebakes.in");
    const row = await queryAs<{ status: string; verification_token: string }>(db, alice, `select status, verification_token from public.website_domains where hostname = 'www.alicebakes.in'`);
    expect(row.rows[0]!.status).toBe("pending");
    expect(row.rows[0]!.verification_token).toMatch(/^[0-9a-f]{32}$/);
  });

  it("rejects invalid hostnames, other people's websites and a fourth domain", async () => {
    await expect(add(alice, "not a domain")).rejects.toThrow();
    await expect(add(alice, "Upper.Example.com")).rejects.toThrow();
    await expect(add(bob, "bob.example.com")).rejects.toThrow();
    await add(alice, "alicebakes.in");
    await add(alice, "shop.alicebakes.in");
    await expect(add(alice, "fourth.alicebakes.in")).rejects.toThrow(/up to 3/);
  });

  it("does not let owners verify their own domain", async () => {
    await queryAs(db, alice, `update public.website_domains set status = 'verified' where hostname = 'alicebakes.in'`);
    const row = await db.query<{ status: string }>(`select status from public.website_domains where hostname = 'alicebakes.in'`);
    expect(row.rows[0]!.status).toBe("pending");
  });

  it("routes a domain to the site only once it is verified and the site is live", async () => {
    const lookup = async () => (await queryAs<{ slug: string | null }>(db, null, `select public.get_site_slug_by_domain('WWW.alicebakes.in') as slug`)).rows[0]!.slug;
    expect(await lookup()).toBeNull();
    await db.query(`update public.website_domains set status = 'verified' where hostname = 'www.alicebakes.in'`);
    expect(await lookup()).toBe("alice-domains");
    await queryAs(db, alice, `select public.unpublish_website($1)`, [id]);
    expect(await lookup()).toBeNull();
  });
});

describe("visitor analytics", () => {
  let id: string;
  const view = (slug: string, page = "") => queryAs(db, null, `select public.record_site_view($1, $2)`, [slug, page]);
  const analytics = async (user: string, website: string | null = null) =>
    (
      await queryAs<{ data: { total: number; daily: { day: string; views: number }[]; pages: { page_slug: string; views: number }[]; websites: { slug: string; views: number }[] } }>(
        db,
        user,
        `select public.get_my_analytics(30, $1) as data`,
        [website],
      )
    ).rows[0]!.data;

  beforeAll(async () => {
    id = await create(alice, "alice-traffic");
    await publish(alice, id);
  });

  it("counts views of live pages by day and page", async () => {
    await view("alice-traffic");
    await view("alice-traffic");
    await view("alice-traffic", "menu");
    const data = await analytics(alice, id);
    expect(data.total).toBe(3);
    expect(data.daily).toHaveLength(30);
    expect(data.daily.at(-1)!.views).toBe(3);
    expect(data.pages).toEqual([{ page_slug: "", views: 2 }, { page_slug: "menu", views: 1 }]);
  });

  it("ignores drafts, unknown sites and invalid page names", async () => {
    await create(alice, "alice-draft-only");
    await view("alice-draft-only");
    await view("missing-site");
    await view("alice-traffic", "../admin");
    await view("alice-traffic", "x".repeat(81));
    expect((await analytics(alice, id)).total).toBe(3);
    const all = await analytics(alice);
    expect(all.websites.find((website) => website.slug === "alice-draft-only")?.views).toBe(0);
  });

  it("shows each owner only their own traffic", async () => {
    expect((await analytics(bob)).total).toBe(0);
    await expect(analytics(bob, id)).rejects.toThrow(/not found/);
    const direct = await queryAs(db, bob, `select * from public.website_daily_views`);
    expect(direct.rows).toHaveLength(0);
    await expect(queryAs(db, null, `select public.get_my_analytics(30, null)`)).rejects.toThrow();
  });
});

describe("plans", () => {
  const billingFor = async (user: string) =>
    (
      await queryAs<{ data: { plan: { slug: string }; usage: { websites: number }; plans: { slug: string; is_current: boolean }[]; pending_request: string | null } }>(
        db,
        user,
        `select public.get_my_billing() as data`,
      )
    ).rows[0]!.data;

  it("starts everyone on the free plan and shows every plan with usage", async () => {
    const data = await billingFor(bob);
    expect(data.plan.slug).toBe("free");
    expect(data.usage.websites).toBe(0);
    expect(data.plans.map((plan) => plan.slug)).toEqual(["free", "starter", "professional", "business", "agency"]);
    expect(data.plans.filter((plan) => plan.is_current).map((plan) => plan.slug)).toEqual(["free"]);
  });

  it("turns a plan request into one open support ticket", async () => {
    await queryAs(db, bob, `select public.request_plan('starter')`);
    await queryAs(db, bob, `select public.request_plan('professional')`);
    const tickets = await queryAs<{ subject: string }>(db, bob, `select subject from public.support_tickets where subject like 'Plan request: %'`);
    expect(tickets.rows).toEqual([{ subject: "Plan request: Professional" }]);
    expect((await billingFor(bob)).pending_request).toBe("Plan request: Professional");
    await expect(queryAs(db, bob, `select public.request_plan('free')`)).rejects.toThrow(/already on this plan/);
    await expect(queryAs(db, bob, `select public.request_plan('nope')`)).rejects.toThrow(/not found/);
  });

  it("lets an admin assign the plan, which resolves the request", async () => {
    await queryAs(db, billing, `select public.admin_set_user_plan($1, 'professional', 12)`, [bob]);
    const data = await billingFor(bob);
    expect(data.plan.slug).toBe("professional");
    expect(data.pending_request).toBeNull();
    await queryAs(db, billing, `select public.admin_set_user_plan($1, 'free')`, [bob]);
    expect((await billingFor(bob)).plan.slug).toBe("free");
  });

  it("does not let users assign themselves a plan", async () => {
    await expect(queryAs(db, bob, `select public.admin_set_user_plan($1, 'agency')`, [bob])).rejects.toThrow(/permission/);
    await expect(queryAs(db, bob, `insert into public.subscriptions (user_id, plan_id) select $1, id from public.plans where slug = 'agency'`, [bob])).rejects.toThrow();
  });
});
