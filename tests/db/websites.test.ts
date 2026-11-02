import { beforeAll, describe, expect, it } from "vitest";
import { createStarterDocument, getThemeDefinitionBySlug } from "@/themes/registry";
import { buildDraftDocument, type WebsiteDraft } from "@/features/websites/document";
import { assignRole, createTestDb, createUser, queryAs, type TestDb } from "./setup";

let db: TestDb;
let alice: string;
let bob: string;
let support: string;

const create = async (user: string | null, slug: string, theme = "hearth", contact = {}) => {
  const result = await queryAs<{ id: string }>(
    db,
    user,
    `select public.create_website(
       p_theme_slug => $1, p_name => 'My Site', p_slug => $2, p_category_slug => 'cafe',
       p_contact => $3::jsonb, p_design => '{"primary":"#112233"}'::jsonb
     ) as id`,
    [theme, slug, JSON.stringify(contact)],
  );
  return result.rows[0]!.id;
};

const getDraft = async (user: string, id: string) => {
  const result = await queryAs<{ draft: WebsiteDraft | null }>(
    db,
    user,
    `select public.get_website_draft($1) as draft`,
    [id],
  );
  return result.rows[0]!.draft;
};

beforeAll(async () => {
  db = await createTestDb();
  alice = await createUser(db, "alice@example.test");
  bob = await createUser(db, "bob@example.test");
  support = await createUser(db, "support@example.test");
  await assignRole(db, support, "support_admin");
}, 60_000);

describe("create_website", () => {
  it("creates the website with all starter pages and sections, as a draft", async () => {
    const id = await create(alice, "alices-cafe", "hearth", { email: "a@example.test" });
    const draft = await getDraft(alice, id);
    const definition = getThemeDefinitionBySlug("hearth")!;

    expect(draft!.component_id).toBe("hearth");
    expect(draft!.pages.map((page) => page.slug)).toEqual(definition.pages.map((page) => page.slug));
    expect(draft!.pages[0]!.sections.map((section) => section.type)).toEqual(
      definition.pages[0]!.sections.map((section) => section.type),
    );

    const status = await queryAs<{ status: string; owner_id: string; category: string }>(
      db,
      alice,
      `select w.status, w.owner_id, c.slug as category from public.websites w join public.categories c on c.id = w.category_id where w.id = $1`,
      [id],
    );
    expect(status.rows[0]).toEqual({ status: "draft", owner_id: alice, category: "cafe" });
  });

  it("replaces sample contact details with the owner's", async () => {
    const id = await create(alice, "contact-site", "hearth", { email: "owner@example.test" });
    const draft = await getDraft(alice, id);
    const contact = draft!.pages.flatMap((page) => page.sections).find((section) => section.type === "contact");
    const props = contact!.props as Record<string, unknown>;
    expect(props.email).toBe("owner@example.test");
    expect(props.phone).toBeUndefined();
    expect(props.address).toBeUndefined();
    expect(props.heading).toBeTruthy();
  });

  it("does not leave a partial website behind when it fails", async () => {
    await expect(create(alice, "alices-cafe")).rejects.toThrow(/unique/);
    await expect(create(alice, "admin")).rejects.toThrow(/check constraint/);
    await expect(create(alice, "no-theme-site", "missing")).rejects.toThrow(/not available/);
    const pages = await db.query<{ count: number }>(
      `select count(*)::int as count from public.websites where slug in ('no-theme-site', 'admin')`,
    );
    expect(pages.rows[0]!.count).toBe(0);
  });

  it("refuses visitors, suspended users, unpublished themes and premium themes", async () => {
    await expect(create(null, "visitor-site")).rejects.toThrow(/permission denied/);

    const suspended = await createUser(db, "suspended@example.test");
    await db.query(`update public.profiles set account_status = 'suspended' where id = $1`, [suspended]);
    await expect(create(suspended, "suspended-site")).rejects.toThrow(/row-level security/);

    await db.exec(`
      insert into public.themes (name, slug, status) values ('Secret', 'secret', 'draft');
      insert into public.theme_versions (theme_id, version, component_id, component_version)
        select id, '1.0.0', 'meridian', '1.0.0' from public.themes where slug = 'secret';
      update public.themes set current_version_id = (
        select v.id from public.theme_versions v join public.themes t on t.id = v.theme_id where t.slug = 'secret'
      ) where slug = 'secret';
    `);
    await expect(create(alice, "secret-site", "secret")).rejects.toThrow(/not available/);

    await db.exec(`update public.themes set is_premium = true where slug = 'atelier'`);
    await expect(create(alice, "premium-site", "atelier")).rejects.toThrow(/Premium/);
    await db.exec(`update public.themes set is_premium = false where slug = 'atelier'`);
  });

  it("keeps a draft readable after its theme is unpublished", async () => {
    const id = await create(alice, "keeps-working", "atelier");
    await db.exec(`update public.themes set status = 'unpublished' where slug = 'atelier'`);
    try {
      expect((await getDraft(alice, id))!.component_id).toBe("atelier");
      const visitor = await queryAs(db, null, `select id from public.theme_versions v where v.component_id = 'atelier'`);
      expect(visitor.rows).toHaveLength(0);
      const stranger = await queryAs(db, bob, `select id from public.themes where slug = 'atelier'`);
      expect(stranger.rows).toHaveLength(0);
    } finally {
      await db.exec(`update public.themes set status = 'published' where slug = 'atelier'`);
    }
  });
});

describe("reading drafts", () => {
  it("does not return another user's draft or website list", async () => {
    const id = await create(alice, "private-draft");
    expect(await getDraft(bob, id)).toBeNull();
    const list = await queryAs(db, bob, `select * from public.list_my_websites()`);
    expect(list.rows).toHaveLength(0);
  });

  it("is blocked for visitors", async () => {
    await expect(
      queryAs(db, null, `select public.get_website_draft(gen_random_uuid())`),
    ).rejects.toThrow(/permission denied/);
    await expect(queryAs(db, null, `select * from public.list_my_websites()`)).rejects.toThrow(/permission denied/);
  });

  it("lists the owner's websites with theme and category names", async () => {
    const owner = await createUser(db, "lister@example.test");
    await create(owner, "listed-site");
    const list = await queryAs(db, owner, `select slug, status, theme_name, category_name from public.list_my_websites()`);
    expect(list.rows).toEqual([
      { slug: "listed-site", status: "draft", theme_name: "Hearth", category_name: "Cafe" },
    ]);
  });
});

describe("duplicate_website", () => {
  it("copies content without publishing state, and later edits stay separate", async () => {
    const id = await create(alice, "original-site", "hearth", { email: "o@example.test" });
    const copy = await queryAs<{ id: string }>(
      db,
      alice,
      `select public.duplicate_website($1, 'Copy', 'original-copy') as id`,
      [id],
    );
    const copyId = copy.rows[0]!.id;
    const [source, duplicate] = [await getDraft(alice, id), await getDraft(alice, copyId)];
    expect(duplicate!.pages).toEqual(source!.pages);
    expect(duplicate!.design).toEqual(source!.design);

    await queryAs(
      db,
      alice,
      `update public.website_pages set title = 'Changed' where website_id = $1 and is_home`,
      [copyId],
    );
    expect((await getDraft(alice, id))!.pages[0]!.title).toBe("Home");
  });

  it("does not let another user copy a website, even an admin who can read it", async () => {
    const id = await create(alice, "not-yours");
    for (const user of [bob, support]) {
      await expect(
        queryAs(db, user, `select public.duplicate_website($1, 'Stolen', 'stolen-copy')`, [id]),
      ).rejects.toThrow(/not found/);
    }
  });
});

describe("is_subdomain_available", () => {
  const available = async (slug: string) =>
    (await queryAs<{ ok: boolean }>(db, alice, `select public.is_subdomain_available($1) as ok`, [slug])).rows[0]!.ok;

  it("rejects taken, reserved and invalid addresses", async () => {
    await create(alice, "taken-name");
    expect(await available("taken-name")).toBe(false);
    expect(await available("admin")).toBe(false);
    expect(await available("Bad Name")).toBe(false);
    expect(await available("free-name")).toBe(true);
  });
});

describe("list_popular_themes", () => {
  it("returns totals only, most used first", async () => {
    const result = await queryAs<{ theme_slug: string; use_count: number | string }>(
      db,
      alice,
      `select * from public.list_popular_themes(2)`,
    );
    expect(result.rows[0]!.theme_slug).toBe("hearth");
    expect(Object.keys(result.rows[0]!).sort()).toEqual(["theme_slug", "use_count"]);
    expect(result.rows).toHaveLength(2);
  });
});

describe("buildDraftDocument", () => {
  const draftFor = (design: Record<string, unknown>): WebsiteDraft => {
    const starter = createStarterDocument(getThemeDefinitionBySlug("meridian")!);
    return {
      id: "x",
      name: "My Site",
      business_name: "Acme",
      component_id: "meridian",
      version: "1.0.0",
      design,
      pages: starter.pages,
    };
  };

  it("applies the site's name, color and a readable button color", () => {
    const dark = buildDraftDocument(draftFor({ primary: "#112233" }))!;
    expect(dark.siteName).toBe("Acme");
    expect(dark.tokens.primary).toBe("#112233");
    expect(dark.tokens.onPrimary).toBe("#FFFFFF");
    expect(buildDraftDocument(draftFor({ primary: "#FFEE88" }))!.tokens.onPrimary).toBe("#111111");
  });

  it("ignores invalid stored design values instead of failing", () => {
    const document = buildDraftDocument(
      draftFor({ primary: "red;background:url(//evil.example)", logoUrl: "javascript:alert(1)" }),
    )!;
    expect(document.tokens.primary).toBe(getThemeDefinitionBySlug("meridian")!.tokens.primary);
    expect(document.logoUrl).toBeUndefined();
  });

  it("returns null when the theme is not registered", () => {
    expect(buildDraftDocument({ ...draftFor({}), component_id: "uploaded-code" })).toBeNull();
    expect(buildDraftDocument({ ...draftFor({}), component_id: null })).toBeNull();
  });
});
