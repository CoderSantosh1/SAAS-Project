import { beforeAll, describe, expect, it } from "vitest";
import { assignRole, createTestDb, createUser, queryAs, type TestDb } from "./setup";

let db: TestDb;
let superAdmin: string;
let platform: string;
let content: string;
let customer: string;
let other: string;
let themeId: string;

const one = async <T = unknown>(user: string | null, sql: string, params: unknown[] = []) =>
  (await queryAs<{ r: T }>(db, user, `select ${sql} as r`, params)).rows[0]!.r;

const fails = (user: string | null, sql: string, params: unknown[] = []) => expect(queryAs(db, user, `select ${sql}`, params)).rejects.toThrow();

beforeAll(async () => {
  db = await createTestDb();
  superAdmin = await createUser(db, "super@example.test");
  platform = await createUser(db, "platform@example.test");
  content = await createUser(db, "content@example.test");
  customer = await createUser(db, "customer@example.test");
  other = await createUser(db, "other@example.test");
  await assignRole(db, superAdmin, "super_admin");
  await assignRole(db, platform, "platform_admin");
  await assignRole(db, content, "content_manager");
  themeId = (await db.query<{ id: string }>(`select id from public.themes where slug = 'hearth'`)).rows[0]!.id;
}, 60_000);

describe("theme code access", () => {
  it("lets admins with the permission download, and nobody else", async () => {
    const download = await one<{ component_id: string; component_version: string; default_config: { pages: unknown[] } }>(superAdmin, `public.begin_theme_code_download($1)`, [themeId]);
    expect(download.component_id).toBe("hearth");
    expect(download.default_config.pages.length).toBeGreaterThan(0);
    expect(await one<boolean>(platform, `public.can_download_theme_code($1)`, [themeId])).toBe(true);

    await fails(content, `public.begin_theme_code_download($1)`, [themeId]);
    await fails(customer, `public.begin_theme_code_download($1)`, [themeId]);
    await fails(null, `public.begin_theme_code_download($1)`, [themeId]);
    await fails(content, `public.admin_grant_theme_code($1, 'customer@example.test')`, [themeId]);
    await fails(customer, `public.admin_list_theme_code_grants($1)`, [themeId]);
  });

  it("gives one customer access to one theme and records it", async () => {
    await fails(platform, `public.admin_grant_theme_code($1, 'nobody@example.test')`, [themeId]);
    await one(platform, `public.admin_grant_theme_code($1, 'Customer@Example.test', 'Agency partner')`, [themeId]);

    const mine = await queryAs<{ name: string }>(db, customer, `select name from public.list_my_theme_code()`);
    expect(mine.rows.map((row) => row.name)).toEqual(["Hearth"]);
    expect((await queryAs(db, other, `select * from public.list_my_theme_code()`)).rows).toHaveLength(0);

    const download = await one<{ component_id: string }>(customer, `public.begin_theme_code_download($1)`, [themeId]);
    expect(download.component_id).toBe("hearth");
    await fails(other, `public.begin_theme_code_download($1)`, [themeId]);

    // Only for that theme.
    const otherTheme = (await db.query<{ id: string }>(`select id from public.themes where slug = 'meridian'`)).rows[0]!.id;
    await fails(customer, `public.begin_theme_code_download($1)`, [otherTheme]);

    const logs = await db.query<{ action: string; actor_email: string }>(
      `select action, actor_email from public.activity_logs where target_id = $1 order by created_at`,
      [themeId],
    );
    expect(logs.rows).toContainEqual({ action: "theme.code_grant", actor_email: "platform@example.test" });
    expect(logs.rows).toContainEqual({ action: "theme.code_download", actor_email: "customer@example.test" });

    const grants = await one<{ email: string; note: string }[]>(superAdmin, `public.admin_list_theme_code_grants($1)`, [themeId]);
    expect(grants).toMatchObject([{ email: "customer@example.test", note: "Agency partner" }]);
  });

  it("cannot be written directly, and customers only see their own access", async () => {
    await fails(customer, `1 from (insert into public.theme_code_grants (theme_id, user_id) values ($1, $2) returning 1) as x`, [themeId, other]);
    const visible = await queryAs(db, other, `select * from public.theme_code_grants`);
    expect(visible.rows).toHaveLength(0);
  });

  it("ends when it expires or is removed", async () => {
    await fails(platform, `public.admin_grant_theme_code($1, 'other@example.test', null, now() - interval '1 day')`, [themeId]);
    await one(platform, `public.admin_grant_theme_code($1, 'other@example.test', null, now() + interval '1 day')`, [themeId]);
    expect(await one<boolean>(other, `public.can_download_theme_code($1)`, [themeId])).toBe(true);
    await db.query(`update public.theme_code_grants set expires_at = now() - interval '1 minute' where user_id = $1`, [other]);
    expect(await one<boolean>(other, `public.can_download_theme_code($1)`, [themeId])).toBe(false);

    const grant = (await db.query<{ id: string }>(`select id from public.theme_code_grants where user_id = $1`, [customer])).rows[0]!.id;
    await one(superAdmin, `public.admin_revoke_theme_code($1)`, [grant]);
    await fails(customer, `public.begin_theme_code_download($1)`, [themeId]);
  });

  it("stops for a suspended customer", async () => {
    await one(platform, `public.admin_grant_theme_code($1, 'customer@example.test')`, [themeId]);
    await db.query(`update public.profiles set account_status = 'suspended' where id = $1`, [customer]);
    expect(await one<boolean>(customer, `public.can_download_theme_code($1)`, [themeId])).toBe(false);
  });
});
