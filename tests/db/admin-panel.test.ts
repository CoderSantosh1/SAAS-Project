import { beforeAll, describe, expect, it } from "vitest";
import { assignRole, createTestDb, createUser, queryAs, type TestDb } from "./setup";

let db: TestDb;
let superAdmin: string;
let platform: string;
let content: string;
let support: string;
let alice: string;
let site: string;

const one = async <T = unknown>(user: string | null, sql: string, params: unknown[] = []) =>
  (await queryAs<{ r: T }>(db, user, `select ${sql} as r`, params)).rows[0]!.r;

const logged = async (action: string) =>
  (await db.query<{ actor_email: string; target_id: string; metadata: Record<string, unknown> }>(
    `select actor_email, target_id, metadata from public.activity_logs where action = $1 order by created_at desc limit 1`,
    [action],
  )).rows[0];

beforeAll(async () => {
  db = await createTestDb();
  superAdmin = await createUser(db, "super@example.test");
  platform = await createUser(db, "platform@example.test");
  content = await createUser(db, "content@example.test");
  support = await createUser(db, "support@example.test");
  alice = await createUser(db, "alice@example.test");
  await assignRole(db, superAdmin, "super_admin");
  await assignRole(db, platform, "platform_admin");
  await assignRole(db, content, "content_manager");
  await assignRole(db, support, "support_admin");
  site = await one<string>(alice, `public.create_website(p_theme_slug => 'hearth', p_name => 'Alice Site', p_slug => 'alice-site', p_category_slug => 'cafe')`);
}, 60_000);

describe("permissions", () => {
  // Each call is refused for a normal user and for the role listed as lacking it.
  const cases: [string, () => string][] = [
    [`public.admin_list_users()`, () => content],
    [`public.admin_set_user_status(gen_random_uuid(), 'suspended')`, () => support],
    [`public.admin_list_categories()`, () => support],
    [`public.admin_list_templates()`, () => support],
    [`public.admin_list_websites()`, () => content],
    [`public.admin_set_website_suspended(gen_random_uuid(), true)`, () => support],
    [`public.admin_list_media()`, () => support],
    [`public.admin_list_domains()`, () => content],
    [`public.admin_analytics()`, () => content],
    [`public.admin_list_plans()`, () => platform],
    [`public.admin_list_tickets()`, () => content],
    [`public.admin_list_activity()`, () => support],
    [`public.admin_save_settings('{}')`, () => platform],
  ];

  it.each(cases)("%s needs its permission", async (call, lacking) => {
    await expect(one(alice, call), "normal user").rejects.toThrow(/do not have permission/);
    await expect(one(lacking(), call), "role without it").rejects.toThrow(/do not have permission/);
    await expect(one(null, call), "visitor").rejects.toThrow(/permission denied/);
  });
});

describe("users", () => {
  it("lists users with website counts, and searches", async () => {
    const result = await one<{ total: number; rows: { email: string; website_count: number }[] }>(
      support,
      `public.admin_list_users(p_search => 'ALICE')`,
    );
    expect(result.total).toBe(1);
    expect(result.rows[0]).toMatchObject({ email: "alice@example.test", website_count: 1 });
  });

  it("suspends without deleting data, blocks the user, restores, and logs each", async () => {
    await one(platform, `public.admin_set_user_status($1, 'suspended', 'Spam')`, [alice]);
    const user = await one<{ account_status: string; suspended_reason: string; websites: unknown[] }>(support, `public.admin_get_user($1)`, [alice]);
    expect(user).toMatchObject({ account_status: "suspended", suspended_reason: "Spam" });
    expect(user.websites).toHaveLength(1);
    expect(await logged("user.suspend")).toMatchObject({ actor_email: "platform@example.test", target_id: alice, metadata: { reason: "Spam" } });
    await expect(queryAs(db, alice, `update public.websites set name = 'x' where id = $1 returning id`, [site])).resolves.toMatchObject({ rows: [] });

    await one(platform, `public.admin_set_user_status($1, 'active')`, [alice]);
    const restored = await one<{ account_status: string; suspended_reason: string | null }>(support, `public.admin_get_user($1)`, [alice]);
    expect(restored).toMatchObject({ account_status: "active", suspended_reason: null });
  });

  it("stops self-suspension, and a lesser admin suspending a Super Admin", async () => {
    await expect(one(platform, `public.admin_set_user_status($1, 'suspended')`, [platform])).rejects.toThrow(/your own account/);
    await expect(one(platform, `public.admin_set_user_status($1, 'suspended')`, [superAdmin])).rejects.toThrow(/Only a Super Admin/);
  });

  it("lets only a Super Admin assign roles, and protects the last one", async () => {
    await expect(one(platform, `public.admin_set_user_roles($1, array['super_admin'])`, [platform])).rejects.toThrow(/Only a Super Admin/);

    const person = await createUser(db, "promoted@example.test");
    await one(superAdmin, `public.admin_set_user_roles($1, array['support_admin'])`, [person]);
    expect(await one(person, `public.has_permission('support.manage')`)).toBe(true);
    await one(superAdmin, `public.admin_set_user_roles($1, array[]::text[])`, [person]);
    expect(await one(person, `public.has_permission('support.manage')`)).toBe(false);

    await expect(one(superAdmin, `public.admin_set_user_roles($1, array[]::text[])`, [superAdmin])).rejects.toThrow(/last Super Admin/);
  });
});

describe("categories", () => {
  const data = (slug: string, status = "published") => JSON.stringify({ name: "Pets", slug, status, display_order: 5, is_featured: true });

  it("creates, updates and deletes, with public visibility following status", async () => {
    const id = await one<string>(content, `public.admin_save_category(null, $1::jsonb)`, [data("pets")]);
    const publicSlugs = async () => (await queryAs<{ slug: string }>(db, null, `select slug from public.list_public_categories()`)).rows.map((row) => row.slug);
    expect(await publicSlugs()).toContain("pets");

    await one(content, `public.admin_save_category($1, $2::jsonb)`, [id, data("pets", "draft")]);
    expect(await publicSlugs()).not.toContain("pets");

    await one(content, `public.admin_delete_category($1)`, [id]);
    expect(await logged("category.delete")).toMatchObject({ metadata: { slug: "pets" } });
  });

  it("refuses to delete a category in use, or take a duplicate slug", async () => {
    const cafe = (await db.query<{ id: string }>(`select id from public.categories where slug = 'cafe'`)).rows[0]!.id;
    await expect(one(content, `public.admin_delete_category($1)`, [cafe])).rejects.toThrow(/archive it instead/);
    await expect(one(content, `public.admin_save_category(null, $1::jsonb)`, [data("cafe")])).rejects.toThrow(/unique/);
  });
});

describe("templates", () => {
  it("creates a listing on a theme, in chosen categories, and deleting keeps websites", async () => {
    const theme = (await db.query<{ id: string }>(`select id from public.themes where slug = 'meridian'`)).rows[0]!.id;
    const yoga = (await db.query<{ id: string }>(`select id from public.categories where slug = 'yoga'`)).rows[0]!.id;
    const id = await one<string>(content, `public.admin_save_template(null, $1::jsonb, $2::uuid[])`, [
      JSON.stringify({ theme_id: theme, name: "Yoga Studio", slug: "yoga-studio", status: "published", is_visible: true }),
      [yoga],
    ]);

    const listed = await queryAs<{ template_slug: string }>(db, null, `select template_slug from public.list_marketplace_templates(p_category_slug => 'yoga')`);
    expect(listed.rows.map((row) => row.template_slug)).toContain("yoga-studio");

    const list = await one<{ slug: string; category_ids: string[] }[]>(content, `public.admin_list_templates()`);
    expect(list.find((row) => row.slug === "yoga-studio")?.category_ids).toEqual([yoga]);

    await one(content, `public.admin_delete_template($1)`, [id]);
    const after = await queryAs(db, null, `select * from public.list_marketplace_templates(p_category_slug => 'yoga')`);
    expect(after.rows).toHaveLength(0);
  });

  it("leaves a custom template alone when its theme is edited", async () => {
    const theme = (await db.query<{ id: string }>(`select id from public.themes where slug = 'atelier'`)).rows[0]!.id;
    await one(content, `public.admin_save_template(null, $1::jsonb, '{}'::uuid[])`, [
      JSON.stringify({ theme_id: theme, name: "Custom Name", slug: "custom-atelier", status: "published" }),
    ]);
    await one(content, `public.update_theme($1, $2::jsonb)`, [theme, JSON.stringify({ name: "Atelier Renamed", slug: "atelier" })]);
    const names = await db.query<{ slug: string; name: string }>(`select slug, name from public.templates where theme_id = $1 order by slug`, [theme]);
    expect(names.rows).toEqual([
      { slug: "atelier", name: "Atelier Renamed" },
      { slug: "custom-atelier", name: "Custom Name" },
    ]);
  });
});

describe("websites", () => {
  it("lists and filters by search, owner and status", async () => {
    const byOwner = await one<{ total: number }>(support, `public.admin_list_websites(p_owner_id => $1)`, [alice]);
    expect(byOwner.total).toBe(1);
    const bySearch = await one<{ rows: { owner_email: string; theme_name: string }[] }>(support, `public.admin_list_websites(p_search => 'alice-site')`);
    expect(bySearch.rows[0]).toMatchObject({ owner_email: "alice@example.test", theme_name: "Hearth" });
    expect((await one<{ total: number }>(support, `public.admin_list_websites(p_status => 'suspended')`)).total).toBe(0);
    expect((await one<{ total: number }>(support, `public.admin_list_websites(p_published_only => true)`)).total).toBe(0);
  });

  it("suspending takes a live site offline, and restoring returns it, with logs", async () => {
    const live = await one<string>(alice, `public.create_website(p_theme_slug => 'hearth', p_name => 'Live', p_slug => 'live-site')`);
    const version = await db.query<{ id: string }>(`insert into public.website_versions (website_id, version_number, snapshot) values ($1, 1, '{}') returning id`, [live]);
    await db.query(`update public.websites set status = 'published', published_version_id = $1 where id = $2`, [version.rows[0]!.id, live]);

    await one(platform, `public.admin_set_website_suspended($1, true, 'Abuse')`, [live]);
    expect(await one(null, `public.get_published_site('live-site')`)).toBeNull();
    expect(await logged("website.suspend")).toMatchObject({ target_id: live, metadata: { reason: "Abuse" } });

    await one(platform, `public.admin_set_website_suspended($1, false)`, [live]);
    expect(await one(null, `public.get_published_site('live-site')`)).not.toBeNull();

    await one(platform, `public.admin_set_website_suspended($1, true)`, [site]);
    await one(platform, `public.admin_set_website_suspended($1, false)`, [site]);
    expect((await one<{ status: string }>(support, `public.admin_get_website($1)`, [site])).status).toBe("draft");
  });

  it("lets an admin read a draft for review, but support cannot moderate", async () => {
    await expect(one(support, `public.admin_set_website_suspended($1, true)`, [site])).rejects.toThrow(/do not have permission/);
    expect(await one(support, `public.get_website_draft($1)`, [site])).not.toBeNull();
  });
});

describe("media", () => {
  it("manages platform files and can never reach a user's file", async () => {
    await one(content, `public.admin_add_media($1::jsonb)`, [
      JSON.stringify({ path: "library/a.png", file_name: "banner.png", mime_type: "image/png", size_bytes: 10 }),
    ]);
    const list = await one<{ id: string; file_name: string }[]>(content, `public.admin_list_media('BANNER')`);
    expect(list).toHaveLength(1);
    expect(await one(content, `public.admin_delete_media($1)`, [list[0]!.id])).toBe("library/a.png");

    const own = await queryAs<{ id: string }>(
      db,
      alice,
      `insert into public.media_assets (scope, owner_id, bucket, path, file_name, mime_type, size_bytes)
       values ('user', $1, 'user-media', $2, 'mine.png', 'image/png', 1) returning id`,
      [alice, `${alice}/mine.png`],
    );
    await expect(one(superAdmin, `public.admin_delete_media($1)`, [own.rows[0]!.id])).rejects.toThrow(/not found/);
    expect(await one(content, `public.admin_list_media('mine')`)).toEqual([]);
  });
});

describe("domains", () => {
  it("lists subdomains and custom domains, and changes status with a log", async () => {
    const domain = await db.query<{ id: string }>(`insert into public.website_domains (website_id, hostname) values ($1, 'alice.example.test') returning id`, [site]);
    const list = await one<{ custom: { hostname: string; owner_email: string }[]; subdomains: { rows: { slug: string }[] } }>(platform, `public.admin_list_domains()`);
    expect(list.custom[0]).toMatchObject({ hostname: "alice.example.test", owner_email: "alice@example.test" });
    expect(list.subdomains.rows.map((row) => row.slug)).toContain("alice-site");

    await one(platform, `public.admin_set_domain_status($1, 'verified')`, [domain.rows[0]!.id]);
    const row = await db.query<{ status: string; verified: boolean }>(`select status, verified_at is not null as verified from public.website_domains where id = $1`, [domain.rows[0]!.id]);
    expect(row.rows[0]).toEqual({ status: "verified", verified: true });
    expect(await logged("domain.status_change")).toMatchObject({ metadata: { status: "verified" } });
  });
});

describe("analytics", () => {
  it("returns real totals, a full daily series, and rankings", async () => {
    const result = await one<{
      days: number;
      totals: { users: number; websites: number };
      series: { websites: number; users: number }[];
      popular_themes: { name: string; count: number }[];
    }>(platform, `public.admin_analytics(7)`);
    const realUsers = (await db.query<{ c: number }>(`select count(*)::int as c from public.profiles`)).rows[0]!.c;
    expect(result.totals.users).toBe(realUsers);
    expect(result.series).toHaveLength(7);
    expect(result.series.at(-1)!.users).toBe(realUsers);
    expect(result.popular_themes[0]).toMatchObject({ name: "Hearth" });
  });

  it("bounds the date range", async () => {
    expect((await one<{ days: number }>(platform, `public.admin_analytics(100000)`)).days).toBe(365);
    expect((await one<{ days: number }>(platform, `public.admin_analytics(-1)`)).days).toBe(7);
  });
});

describe("plans", () => {
  it("activates a plan publicly only when turned on, and adds new ones", async () => {
    const list = await one<{ id: string; slug: string; name: string }[]>(superAdmin, `public.admin_list_plans()`);
    expect(list).toHaveLength(5);
    const starter = list.find((plan) => plan.slug === "starter")!;
    const data = { name: "Starter", slug: "starter", monthly_price_paise: 9900, features: ["One"], is_active: true };
    await one(superAdmin, `public.admin_save_plan($1, $2::jsonb)`, [starter.id, JSON.stringify(data)]);
    const visible = await queryAs<{ slug: string }>(db, null, `select slug from public.plans`);
    expect(visible.rows.map((row) => row.slug)).toContain("starter");
    await one(superAdmin, `public.admin_save_plan($1, $2::jsonb)`, [starter.id, JSON.stringify({ ...data, is_active: false })]);
    expect((await queryAs<{ slug: string }>(db, null, `select slug from public.plans`)).rows.map((row) => row.slug)).not.toContain("starter");

    await one(superAdmin, `public.admin_save_plan(null, $1::jsonb)`, [JSON.stringify({ ...data, slug: "extra", name: "Extra", is_active: false })]);
    expect(await one<unknown[]>(superAdmin, `public.admin_list_plans()`)).toHaveLength(6);
  });
});

describe("support", () => {
  it("receives a user's ticket, and the user sees only their own reply", async () => {
    await queryAs(db, alice, `insert into public.support_tickets (user_id, subject, message) values ($1, 'Help', 'Please')`, [alice]);
    const list = await one<{ rows: { id: string; user_email: string }[] }>(support, `public.admin_list_tickets()`);
    expect(list.rows[0]!.user_email).toBe("alice@example.test");

    await one(support, `public.admin_update_ticket($1, 'resolved', 'high', 'Fixed it')`, [list.rows[0]!.id]);
    const own = await queryAs(db, alice, `select status, admin_response from public.support_tickets`);
    expect(own.rows).toEqual([{ status: "resolved", admin_response: "Fixed it" }]);
    expect((await queryAs(db, content, `select id from public.support_tickets`)).rows).toHaveLength(0);
    await expect(
      queryAs(db, alice, `update public.support_tickets set status = 'open' returning id`),
    ).resolves.toMatchObject({ rows: [] });
  });
});

describe("activity log", () => {
  it("lists, searches and pages", async () => {
    const all = await one<{ total: number; rows: unknown[] }>(superAdmin, `public.admin_list_activity(p_limit => 2)`);
    expect(all.rows).toHaveLength(2);
    expect(all.total).toBeGreaterThan(2);
    const found = await one<{ rows: { action: string }[] }>(superAdmin, `public.admin_list_activity(p_search => 'user.suspend')`);
    expect(found.rows.every((row) => row.action === "user.suspend")).toBe(true);
  });
});

describe("settings", () => {
  it("saves known keys publicly, with a log, and refuses unknown or private ones", async () => {
    await one(superAdmin, `public.admin_save_settings($1::jsonb)`, [JSON.stringify({ "contact.email": "help@example.test" })]);
    const visible = await queryAs<{ value: string }>(db, null, `select value from public.platform_settings where key = 'contact.email'`);
    expect(visible.rows[0]!.value).toBe("help@example.test");
    expect((await logged("settings.update"))?.metadata).toEqual({ keys: ["contact.email"] });

    await expect(one(superAdmin, `public.admin_save_settings('{"secret.key":"x"}')`)).rejects.toThrow(/Unknown setting/);
  });
});
