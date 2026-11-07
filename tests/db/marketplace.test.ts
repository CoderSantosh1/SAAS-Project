import { beforeAll, describe, expect, it } from "vitest";
import { assignRole, createTestDb, createUser, queryAs, type TestDb } from "./setup";

type Row = { template_slug: string; theme_slug: string; category_names: string[] };

let db: TestDb;
let admin: string;

const list = (user: string | null, args = "") =>
  queryAs<Row>(db, user, `select * from public.list_marketplace_templates(${args})`).then(
    (result) => result.rows.map((row) => row.template_slug).sort(),
  );

beforeAll(async () => {
  db = await createTestDb();
  admin = await createUser(db, "admin@example.test");
  await assignRole(db, admin, "super_admin");

  await db.exec(`
    insert into public.themes (name, slug, status) values
      ('Hidden Draft', 'hidden-draft', 'draft'),
      ('Pulled', 'pulled', 'unpublished');
    insert into public.templates (theme_id, name, slug, status)
    select id, name, slug, 'published' from public.themes where slug in ('hidden-draft', 'pulled');
    insert into public.templates (theme_id, name, slug, status)
    select id, 'Unlisted', 'unlisted', 'draft' from public.themes where slug = 'meridian';
    insert into public.templates (theme_id, name, slug, status, is_visible)
    select id, 'Invisible', 'invisible', 'published', false from public.themes where slug = 'meridian';
  `);
}, 60_000);

describe("list_marketplace_templates", () => {
  const PUBLIC = ["atelier", "hearth", "meridian"];

  it("shows visitors only published, visible templates of published themes", async () => {
    expect(await list(null)).toEqual(PUBLIC);
  });

  it("shows an admin the same listing as a visitor", async () => {
    expect(await list(admin)).toEqual(PUBLIC);
  });

  it("filters by category", async () => {
    expect(await list(null, `p_category_slug => 'cafe'`)).toEqual(["hearth"]);
    expect(await list(null, `p_category_slug => 'yoga'`)).toEqual([]);
  });

  it("searches name and description, ignoring case", async () => {
    expect(await list(null, `p_search => 'ATELIER'`)).toEqual(["atelier"]);
    expect(await list(null, `p_search => 'hospitality'`)).toEqual(["hearth"]);
  });

  it("treats search wildcards as plain text", async () => {
    expect(await list(null, `p_search => '%'`)).toEqual([]);
    expect(await list(null, `p_search => '_'`)).toEqual([]);
  });

  it("treats a SQL injection attempt as plain text", async () => {
    const result = await queryAs(
      db,
      null,
      `select * from public.list_marketplace_templates(p_search => $1)`,
      ["'; drop table public.themes; --"],
    );
    expect(result.rows).toEqual([]);
    expect(await list(null)).toEqual(PUBLIC);
  });

  it("caps the limit", async () => {
    expect(await list(null, `p_limit => 1`)).toHaveLength(1);
    expect(await list(null, `p_limit => -5`)).toHaveLength(1);
  });

  it("returns category names and theme slug", async () => {
    const result = await queryAs<Row>(
      db,
      null,
      `select * from public.list_marketplace_templates(p_search => 'Hearth')`,
    );
    expect(result.rows[0]!.theme_slug).toBe("hearth");
    expect(result.rows[0]!.category_names).toEqual(["Restaurant", "Cafe", "Bakery", "Hotel"]);
  });
});

describe("list_public_categories", () => {
  it("counts only public templates", async () => {
    const result = await queryAs<{ slug: string; template_count: string | number }>(
      db,
      null,
      `select slug, template_count from public.list_public_categories()`,
    );
    expect(result.rows).toHaveLength(55);
    const count = (slug: string) => Number(result.rows.find((row) => row.slug === slug)!.template_count);
    expect(count("restaurant")).toBe(1);
    expect(count("yoga")).toBe(0);
  });

  it("hides unpublished categories", async () => {
    await db.exec(`insert into public.categories (name, slug) values ('Secret', 'secret')`);
    const result = await queryAs(db, null, `select id from public.list_public_categories() where slug = 'secret'`);
    expect(result.rows).toHaveLength(0);
  });
});

describe("get_marketplace_theme", () => {
  const get = async (user: string | null, slug: string) => {
    const result = await queryAs<{ theme: Record<string, unknown> | null }>(
      db,
      user,
      `select public.get_marketplace_theme($1) as theme`,
      [slug],
    );
    return result.rows[0]!.theme;
  };

  it("returns a published theme without internal fields", async () => {
    const theme = await get(null, "hearth");
    expect(theme).toMatchObject({ name: "Hearth", version: "1.0.0", is_premium: false });
    expect(theme!.categories).toContainEqual({ name: "Cafe", slug: "cafe" });
    expect(theme).not.toHaveProperty("created_by");
    expect(theme).not.toHaveProperty("package_path");
  });

  it("hides unpublished and missing themes, even from admins", async () => {
    for (const slug of ["hidden-draft", "pulled", "missing"]) {
      expect(await get(null, slug), slug).toBeNull();
      expect(await get(admin, slug), slug).toBeNull();
    }
  });
});

describe("plans", () => {
  it("shows visitors the free plan with its features", async () => {
    const result = await queryAs<{ slug: string; features: string[] }>(
      db,
      null,
      `select slug, features from public.plans`,
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.features.length).toBeGreaterThan(0);
  });
});
