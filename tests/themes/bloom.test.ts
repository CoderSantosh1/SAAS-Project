import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, createUser, queryAs, type TestDb } from "../db/setup";

describe("a new code theme", () => {
  let db: TestDb;

  beforeAll(async () => {
    db = await createTestDb();
  }, 60_000);

  it("arrives for review, hidden from visitors until an admin publishes it", async () => {
    const status = await db.query<{ status: string }>(`select status from public.themes where slug = 'bloom'`);
    expect(status.rows[0]!.status).toBe("under_review");

    const listed = await queryAs<{ theme_slug: string }>(db, null, `select theme_slug from public.list_marketplace_templates()`);
    expect(listed.rows.map((row) => row.theme_slug)).not.toContain("bloom");
    const preview = await queryAs<{ preview: unknown }>(db, null, `select public.get_theme_preview('bloom') as preview`);
    expect(preview.rows[0]!.preview).toBeNull();
  });

  it("can be published, and then builds websites with its own section types", async () => {
    const admin = await createUser(db, "content@example.test");
    await db.query(
      `insert into public.admin_user_roles (user_id, role_id) select $1, id from public.admin_roles where slug = 'content_manager'`,
      [admin],
    );
    const theme = await db.query<{ id: string }>(`select id from public.themes where slug = 'bloom'`);
    await queryAs(db, admin, `select public.set_theme_status($1, 'published')`, [theme.rows[0]!.id]);

    const listed = await queryAs<{ theme_slug: string }>(db, null, `select theme_slug from public.list_marketplace_templates(p_category_slug => 'ivf-center')`);
    expect(listed.rows.map((row) => row.theme_slug)).toContain("bloom");

    const user = await createUser(db, "clinic@example.test");
    const site = await queryAs<{ id: string }>(
      db,
      user,
      `select public.create_website(p_theme_slug => 'bloom', p_name => 'My Clinic', p_slug => 'my-clinic', p_contact => '{"email":"me@example.test"}')`,
    );
    const draft = await queryAs<{ draft: { component_id: string; pages: { sections: { type: string; props: Record<string, unknown> }[] }[] } }>(
      db,
      user,
      `select public.get_website_draft($1) as draft`,
      [Object.values(site.rows[0]!)[0]],
    );
    const sections = draft.rows[0]!.draft.pages.flatMap((page) => page.sections);
    expect(draft.rows[0]!.draft.component_id).toBe("bloom");
    expect(sections.map((section) => section.type)).toContain("arch-hero");
    // Sample contact details are replaced with the owner's.
    expect(sections.find((section) => section.type === "contact")?.props).toMatchObject({ email: "me@example.test" });
    expect(sections.find((section) => section.type === "contact")?.props.phone).toBeUndefined();
  });
});
