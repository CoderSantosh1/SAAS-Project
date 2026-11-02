import { beforeAll, describe, expect, it } from "vitest";
import { assignRole, createTestDb, createUser, queryAs, type TestDb } from "./setup";

let db: TestDb;
let admin: string;
let support: string;
let user: string;
let categoryId: string;

const tokens = {
  primary: "#112233",
  onPrimary: "#FFFFFF",
  background: "#FFFFFF",
  surface: "#EEEEEE",
  text: "#000000",
  mutedText: "#333333",
  border: "#DDDDDD",
  headingFont: "sora",
  bodyFont: "inter",
  radius: "md",
};

const versionPayload = (version = "1.0.0") => ({
  version,
  component_id: "meridian",
  component_version: "1.0.0",
  package_path: "uploads/x.zip",
  design_tokens: tokens,
  default_config: {
    pages: [{ title: "Home", slug: "home", isHome: true, sections: [{ type: "cta", props: { heading: "Uploaded", button: { label: "Go", href: "/x" } } }] }],
  },
  sections: [{ type: "cta", label: "Call to action", default_props: {}, props_schema: {} }],
});

const themePayload = (slug: string, changes = {}) => ({
  name: `Theme ${slug}`,
  slug,
  description: "Desc",
  category_id: categoryId,
  supported_features: ["responsive"],
  ...changes,
});

async function register(slug: string, changes = {}) {
  const result = await queryAs<{ id: string }>(
    db,
    admin,
    `select public.register_theme($1::jsonb, $2::jsonb) as id`,
    [JSON.stringify(themePayload(slug, changes)), JSON.stringify(versionPayload())],
  );
  return result.rows[0]!.id;
}

const setStatus = (id: string, status: string, as = admin) =>
  queryAs(db, as, `select public.set_theme_status($1, $2::public.theme_status)`, [id, status]);

const visitorList = async () =>
  (await queryAs<{ theme_slug: string }>(db, null, `select theme_slug from public.list_marketplace_templates()`)).rows.map(
    (row) => row.theme_slug,
  );

const logs = async (action: string) =>
  (await db.query<{ actor_email: string; target_id: string; metadata: Record<string, unknown> }>(
    `select actor_email, target_id, metadata from public.activity_logs where action = $1 order by created_at`,
    [action],
  )).rows;

beforeAll(async () => {
  db = await createTestDb();
  admin = await createUser(db, "content@example.test");
  support = await createUser(db, "support@example.test");
  user = await createUser(db, "user@example.test");
  await assignRole(db, admin, "content_manager");
  await assignRole(db, support, "support_admin");
  categoryId = (await db.query<{ id: string }>(`select id from public.categories where slug = 'yoga'`)).rows[0]!.id;
}, 60_000);

describe("access", () => {
  const calls = (id: string) => [
    `select * from public.list_admin_themes()`,
    `select public.get_admin_theme('${id}')`,
    `select public.register_theme('{}', '{}')`,
    `select public.add_theme_version('${id}', '{}')`,
    `select public.activate_theme_version('${id}', '${id}')`,
    `select public.update_theme('${id}', '{}')`,
    `select public.set_theme_status('${id}', 'published')`,
    `select public.duplicate_theme_metadata('${id}')`,
    `select public.delete_theme('${id}')`,
  ];

  it("refuses visitors, normal users and admins without themes.manage", async () => {
    const id = await register("access-check");
    for (const call of calls(id)) {
      await expect(queryAs(db, null, call), call).rejects.toThrow(/permission denied/);
      for (const person of [user, support]) {
        await expect(queryAs(db, person, call), call).rejects.toThrow(/permission to manage themes/);
      }
    }
  });

  it("does not let anyone skip the audit log by inserting a version directly", async () => {
    const id = await register("no-skip");
    await expect(
      queryAs(db, admin, `select public.insert_theme_version($1, '{}')`, [id]),
    ).rejects.toThrow(/permission denied/);
  });

  it("lets only themes.manage read the uploaded package bucket", async () => {
    await db.exec(`insert into storage.objects (bucket_id, name) values ('theme-packages', 'uploads/a.zip')`);
    expect((await queryAs(db, admin, `select id from storage.objects where bucket_id = 'theme-packages'`)).rows).toHaveLength(1);
    expect((await queryAs(db, user, `select id from storage.objects where bucket_id = 'theme-packages'`)).rows).toHaveLength(0);
  });

  it("lets a user store nothing under the platform's theme folder", async () => {
    await expect(
      queryAs(db, user, `insert into storage.objects (bucket_id, name) values ('platform-media', 'themes/x/evil.png')`),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("upload and review", () => {
  it("keeps an uploaded theme away from the public until it is published", async () => {
    const id = await register("in-review");

    const row = await db.query<{ status: string; current: boolean }>(
      `select status, current_version_id is not null as current from public.themes where id = $1`,
      [id],
    );
    expect(row.rows[0]).toEqual({ status: "under_review", current: true });
    expect(await visitorList()).not.toContain("in-review");
    const preview = await queryAs<{ preview: unknown }>(db, null, `select public.get_theme_preview('in-review') as preview`);
    expect(preview.rows[0]!.preview).toBeNull();

    const review = await queryAs<{ version: { design_tokens: unknown } }>(
      db,
      admin,
      `select public.get_admin_theme_version(current_version_id) as version from public.themes where id = $1`,
      [id],
    );
    expect(review.rows[0]!.version.design_tokens).toEqual(tokens);
  });

  it("logs the upload under the real admin", async () => {
    const id = await register("logged-upload");
    const entry = (await logs("theme.upload")).find((log) => log.target_id === id);
    expect(entry?.actor_email).toBe("content@example.test");
    expect(entry?.metadata).toMatchObject({ slug: "logged-upload", version: "1.0.0" });
  });

  it("refuses a duplicate slug, leaving nothing behind", async () => {
    await register("taken-theme");
    await expect(register("taken-theme")).rejects.toThrow(/unique/);
    const count = await db.query<{ count: number }>(`select count(*)::int as count from public.themes where slug = 'taken-theme'`);
    expect(count.rows[0]!.count).toBe(1);
  });
});

describe("publishing", () => {
  it("puts the theme in the marketplace and its category, and unpublishing removes it", async () => {
    const id = await register("goes-live");
    await setStatus(id, "published");

    expect(await visitorList()).toContain("goes-live");
    const inCategory = await queryAs<{ theme_slug: string }>(
      db,
      null,
      `select theme_slug from public.list_marketplace_templates(p_category_slug => 'yoga')`,
    );
    expect(inCategory.rows.map((row) => row.theme_slug)).toContain("goes-live");
    const preview = await queryAs<{ preview: { design_tokens: unknown } }>(db, null, `select public.get_theme_preview('goes-live') as preview`);
    expect(preview.rows[0]!.preview.design_tokens).toEqual(tokens);

    await setStatus(id, "unpublished");
    expect(await visitorList()).not.toContain("goes-live");

    await setStatus(id, "published");
    const templates = await db.query<{ count: number }>(`select count(*)::int as count from public.templates where theme_id = $1`, [id]);
    expect(templates.rows[0]!.count).toBe(1);
  });

  it("logs status changes", async () => {
    const id = await register("status-log");
    await setStatus(id, "published");
    expect((await logs("theme.status_change")).find((log) => log.target_id === id)?.metadata).toEqual({
      from: "under_review",
      to: "published",
    });
  });

  it("refuses to publish without a version or a category", async () => {
    const noCategory = await register("no-category", { category_id: null });
    await expect(setStatus(noCategory, "published")).rejects.toThrow(/Choose a category/);

    const source = await register("copy-source");
    const copy = await queryAs<{ id: string }>(db, admin, `select public.duplicate_theme_metadata($1) as id`, [source]);
    await expect(setStatus(copy.rows[0]!.id, "published")).rejects.toThrow(/Upload a version/);
  });

  it("copies only the details when duplicating, as a draft", async () => {
    const source = await register("dup-source");
    const copy = await queryAs<{ id: string }>(db, admin, `select public.duplicate_theme_metadata($1) as id`, [source]);
    const row = await db.query<{ status: string; current_version_id: string | null; slug: string }>(
      `select status, current_version_id, slug from public.themes where id = $1`,
      [copy.rows[0]!.id],
    );
    expect(row.rows[0]!.status).toBe("draft");
    expect(row.rows[0]!.current_version_id).toBeNull();
    expect(row.rows[0]!.slug).toMatch(/^dup-source-copy-/);
  });
});

describe("a website built on an uploaded theme", () => {
  it("is created from the theme's content and renders with its own tokens", async () => {
    const id = await register("site-theme");
    await setStatus(id, "published");
    const site = await queryAs<{ id: string }>(
      db,
      user,
      `select public.create_website(p_theme_slug => 'site-theme', p_name => 'Mine', p_slug => 'mine-site') as id`,
    );
    const draft = await queryAs<{ draft: { component_id: string; version: string; design_tokens: unknown; pages: { sections: { props: { heading: string } }[] }[] } }>(
      db,
      user,
      `select public.get_website_draft($1) as draft`,
      [site.rows[0]!.id],
    );
    const { component_id, version, design_tokens, pages } = draft.rows[0]!.draft;
    expect(component_id).toBe("meridian");
    expect(version).toBe("1.0.0");
    expect(design_tokens).toEqual(tokens);
    expect(pages[0]!.sections[0]!.props.heading).toBe("Uploaded");
  });
});

describe("versions", () => {
  async function versionIdOf(themeId: string, version: string) {
    return (await db.query<{ id: string }>(`select id from public.theme_versions where theme_id = $1 and version = $2`, [themeId, version])).rows[0]!.id;
  }

  it("adds a version without changing anything, until it is activated", async () => {
    const id = await register("versioned");
    await setStatus(id, "published");
    const site = await queryAs<{ id: string }>(db, user, `select public.create_website(p_theme_slug => 'versioned', p_name => 'Old', p_slug => 'old-site') as id`);
    const v1 = await versionIdOf(id, "1.0.0");

    await queryAs(db, admin, `select public.add_theme_version($1, $2::jsonb)`, [id, JSON.stringify(versionPayload("2.0.0"))]);
    const v2 = await versionIdOf(id, "2.0.0");
    const current = async () => (await db.query<{ current_version_id: string }>(`select current_version_id from public.themes where id = $1`, [id])).rows[0]!.current_version_id;
    expect(await current()).toBe(v1);

    await queryAs(db, admin, `select public.activate_theme_version($1, $2)`, [id, v2]);
    expect(await current()).toBe(v2);

    // Existing websites stay on the version they were built on.
    const kept = await db.query<{ theme_version_id: string }>(`select theme_version_id from public.websites where id = $1`, [site.rows[0]!.id]);
    expect(kept.rows[0]!.theme_version_id).toBe(v1);

    // Rollback.
    await queryAs(db, admin, `select public.activate_theme_version($1, $2)`, [id, v1]);
    expect(await current()).toBe(v1);
    expect(await versionIdOf(id, "2.0.0")).toBe(v2);
  });

  it("refuses a repeated version number and another theme's version", async () => {
    const id = await register("version-rules");
    await expect(
      queryAs(db, admin, `select public.add_theme_version($1, $2::jsonb)`, [id, JSON.stringify(versionPayload("1.0.0"))]),
    ).rejects.toThrow(/unique/);

    const other = await register("version-other");
    const otherVersion = await versionIdOf(other, "1.0.0");
    await expect(
      queryAs(db, admin, `select public.activate_theme_version($1, $2)`, [id, otherVersion]),
    ).rejects.toThrow(/Version not found/);
  });
});

describe("delete_theme", () => {
  const remove = (id: string) => queryAs(db, admin, `select public.delete_theme($1)`, [id]);

  it("deletes an unused theme with everything under it", async () => {
    const id = await register("delete-me");
    await setStatus(id, "published");
    await setStatus(id, "unpublished");
    await remove(id);
    const left = await db.query<{ themes: number; versions: number; templates: number }>(
      `select (select count(*)::int from public.themes where id = $1) as themes,
        (select count(*)::int from public.theme_versions where theme_id = $1) as versions,
        (select count(*)::int from public.templates where theme_id = $1) as templates`,
      [id],
    );
    expect(left.rows[0]).toEqual({ themes: 0, versions: 0, templates: 0 });
    expect((await logs("theme.delete")).at(-1)?.metadata).toEqual({ slug: "delete-me" });
  });

  it("refuses a published theme, or one that websites use", async () => {
    const id = await register("in-use");
    await setStatus(id, "published");
    await expect(remove(id)).rejects.toThrow(/Unpublish/);

    await queryAs(db, user, `select public.create_website(p_theme_slug => 'in-use', p_name => 'S', p_slug => 'in-use-site')`);
    await setStatus(id, "archived");
    await expect(remove(id)).rejects.toThrow(/archive it instead/);
    const count = await db.query<{ count: number }>(`select count(*)::int as count from public.themes where id = $1`, [id]);
    expect(count.rows[0]!.count).toBe(1);
  });
});

describe("update_theme", () => {
  it("updates the theme and the listing users see, and logs it", async () => {
    const id = await register("edit-me");
    await setStatus(id, "published");
    await queryAs(db, admin, `select public.update_theme($1, $2::jsonb)`, [
      id,
      JSON.stringify(themePayload("edit-me", { name: "Edited", is_featured: true })),
    ]);
    const list = await queryAs<{ name: string; is_featured: boolean }>(
      db,
      null,
      `select name, is_featured from public.list_marketplace_templates() where theme_slug = 'edit-me'`,
    );
    expect(list.rows[0]).toEqual({ name: "Edited", is_featured: true });
    expect((await logs("theme.update")).some((log) => log.target_id === id)).toBe(true);
  });
});
