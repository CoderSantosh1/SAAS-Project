import { beforeAll, describe, expect, it } from "vitest";
import { assignRole, createTestDb, createUser, queryAs, type TestDb } from "./setup";

const VISITOR = null;

let db: TestDb;
let alice: string;
let bob: string;
let mallory: string;
let superAdmin: string;
let support: string;
let content: string;
let aliceSite: string;
let aliceHome: string;

async function createSite(owner: string, slug: string) {
  const result = await queryAs<{ id: string }>(
    db,
    owner,
    `insert into public.websites (owner_id, name, slug) values ($1, 'Site', $2) returning id`,
    [owner, slug],
  );
  return result.rows[0]!.id;
}

beforeAll(async () => {
  db = await createTestDb();
  alice = await createUser(db, "alice@example.test");
  bob = await createUser(db, "bob@example.test");
  mallory = await createUser(db, "mallory@example.test");
  superAdmin = await createUser(db, "super@example.test");
  support = await createUser(db, "support@example.test");
  content = await createUser(db, "content@example.test");
  await assignRole(db, superAdmin, "super_admin");
  await assignRole(db, support, "support_admin");
  await assignRole(db, content, "content_manager");

  aliceSite = await createSite(alice, "alice-site");
  const page = await queryAs<{ id: string }>(
    db,
    alice,
    `insert into public.website_pages (website_id, title, slug, is_home)
     values ($1, 'Home', 'home', true) returning id`,
    [aliceSite],
  );
  aliceHome = page.rows[0]!.id;
  await queryAs(
    db,
    alice,
    `insert into public.website_sections (page_id, section_type, props)
     values ($1, 'hero', '{"heading":"secret draft"}')`,
    [aliceHome],
  );
}, 60_000);

describe("reference data", () => {
  it("seeds the 50 original and 5 India categories with valid unique slugs", async () => {
    const result = await queryAs<{ slug: string }>(
      db,
      VISITOR,
      `select slug from public.categories`,
    );
    expect(result.rows).toHaveLength(55);
    expect(result.rows.map((row) => row.slug)).toContain("e-commerce");
    expect(result.rows.map((row) => row.slug)).toContain("sweet-shop");
  });

  it("creates a profile when a user signs up", async () => {
    const result = await queryAs<{ email: string }>(
      db,
      alice,
      `select email from public.profiles`,
    );
    expect(result.rows).toEqual([{ email: "alice@example.test" }]);
  });

  it("shows visitors only the active plan", async () => {
    const result = await queryAs<{ slug: string }>(db, VISITOR, `select slug from public.plans`);
    expect(result.rows).toEqual([{ slug: "free" }]);
  });
});

describe("function privileges", () => {
  const executableBy = async (role: string) => {
    const result = await db.query<{ name: string }>(
      `select p.proname as name
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and has_function_privilege($1, p.oid, 'execute')
       order by 1`,
      [role],
    );
    return result.rows.map((row) => row.name);
  };

  // A new function must be added here on purpose to become reachable by visitors.
  it("lets visitors run only the functions meant for them", async () => {
    expect(await executableBy("anon")).toEqual([
      "get_marketplace_theme",
      "get_published_site",
      "get_theme_preview",
      "is_template_public",
      "is_theme_published",
      "is_theme_version_published",
      "is_valid_subdomain",
      "list_marketplace_templates",
      "list_public_categories",
    ]);
  });

  it("never lets signed-in users run the bootstrap function", async () => {
    expect(await executableBy("authenticated")).not.toContain("grant_super_admin");
  });

  it("keeps new functions private by default", async () => {
    await db.exec(`create function public.future_function() returns int language sql as 'select 1'`);
    try {
      expect(await executableBy("anon")).not.toContain("future_function");
      expect(await executableBy("authenticated")).not.toContain("future_function");
    } finally {
      await db.exec(`drop function public.future_function()`);
    }
  });
});

describe("tenant isolation", () => {
  it("hides one user's website and drafts from another user", async () => {
    for (const table of ["websites", "website_pages", "website_sections", "website_versions"]) {
      const result = await queryAs(db, bob, `select * from public.${table}`);
      expect(result.rows, table).toHaveLength(0);
    }
  });

  it("blocks visitors from every website table", async () => {
    for (const table of ["websites", "website_pages", "website_sections", "profiles"]) {
      await expect(
        queryAs(db, VISITOR, `select * from public.${table}`),
        table,
      ).rejects.toThrow(/permission denied/);
    }
  });

  it("does not let a user change another user's website", async () => {
    const update = await queryAs(
      db,
      bob,
      `update public.websites set name = 'hacked' where id = $1 returning id`,
      [aliceSite],
    );
    const remove = await queryAs(
      db,
      bob,
      `delete from public.websites where id = $1 returning id`,
      [aliceSite],
    );
    expect(update.rows).toHaveLength(0);
    expect(remove.rows).toHaveLength(0);
  });

  it("does not let a user create a website for someone else", async () => {
    await expect(
      queryAs(db, bob, `insert into public.websites (owner_id, name, slug) values ($1, 'x', 'bobs-fake')`, [alice]),
    ).rejects.toThrow(/row-level security/);
  });

  it("does not let a user add pages to another user's website", async () => {
    await expect(
      queryAs(db, bob, `insert into public.website_pages (website_id, title, slug) values ($1, 'x', 'x')`, [aliceSite]),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("publishing state", () => {
  it("stops owners from publishing directly or transferring ownership", async () => {
    await expect(
      queryAs(db, alice, `update public.websites set status = 'published' where id = $1`, [aliceSite]),
    ).rejects.toThrow(/publishing state/);
    await expect(
      queryAs(db, alice, `update public.websites set owner_id = $1 where id = $2`, [bob, aliceSite]),
    ).rejects.toThrow(/owner cannot be changed/);
  });

  it("stops owners from inserting an already published website", async () => {
    await expect(
      queryAs(db, bob, `insert into public.websites (owner_id, name, slug, status) values ($1, 'x', 'bob-live', 'published')`, [bob]),
    ).rejects.toThrow(/row-level security/);
  });

  it("serves only the published snapshot publicly, not later draft edits", async () => {
    const version = await db.query<{ id: string }>(
      `insert into public.website_versions (website_id, version_number, snapshot)
       values ($1, 1, '{"heading":"live"}') returning id`,
      [aliceSite],
    );
    const before = await queryAs<{ site: unknown }>(
      db,
      VISITOR,
      `select public.get_published_site('alice-site') as site`,
    );
    expect(before.rows[0]!.site).toBeNull();

    await db.query(
      `update public.websites set status = 'published', published_version_id = $1 where id = $2`,
      [version.rows[0]!.id, aliceSite],
    );
    await queryAs(
      db,
      alice,
      `update public.website_sections set props = '{"heading":"new draft"}' where page_id = $1`,
      [aliceHome],
    );

    const after = await queryAs<{ site: { snapshot: unknown; slug: string } }>(
      db,
      VISITOR,
      `select public.get_published_site('alice-site') as site`,
    );
    expect(after.rows[0]!.site.snapshot).toEqual({ heading: "live" });
    expect(JSON.stringify(after.rows[0]!.site)).not.toContain("draft");
  });

  it("rejects reserved and malformed subdomains", async () => {
    for (const slug of ["admin", "www", "Has-Caps", "-bad", "a"]) {
      await expect(createSite(bob, slug), slug).rejects.toThrow(/check constraint/);
    }
  });

  it("prevents duplicate subdomains", async () => {
    await expect(createSite(bob, "alice-site")).rejects.toThrow(/unique/);
  });
});

describe("homepage protection", () => {
  it("refuses to delete the homepage but allows deleting the website", async () => {
    await expect(
      queryAs(db, alice, `delete from public.website_pages where id = $1`, [aliceHome]),
    ).rejects.toThrow(/homepage cannot be deleted/);

    const site = await createSite(bob, "bob-disposable");
    await queryAs(
      db,
      bob,
      `insert into public.website_pages (website_id, title, slug, is_home) values ($1, 'Home', 'home', true)`,
      [site],
    );
    const removed = await queryAs(db, bob, `delete from public.websites where id = $1 returning id`, [site]);
    expect(removed.rows).toHaveLength(1);
  });
});

describe("admin access", () => {
  it("does not let a user grant themselves admin rights", async () => {
    await expect(
      queryAs(
        db,
        mallory,
        `insert into public.admin_user_roles (user_id, role_id)
         values ($1, (select id from public.admin_roles where slug = 'super_admin'))`,
        [mallory],
      ),
    ).rejects.toThrow(/row-level security|permission denied/);
    const check = await queryAs<{ allowed: boolean }>(
      db,
      mallory,
      `select public.is_admin() as allowed`,
    );
    expect(check.rows[0]!.allowed).toBe(false);
  });

  it("does not let API roles run the bootstrap function", async () => {
    for (const user of [mallory, VISITOR, support]) {
      await expect(
        queryAs(db, user, `select public.grant_super_admin('mallory@example.test')`),
      ).rejects.toThrow(/permission denied/);
    }
  });

  it("stops users from lifting their own suspension or changing email", async () => {
    await expect(
      queryAs(db, mallory, `update public.profiles set account_status = 'suspended' where id = $1`, [mallory]),
    ).rejects.toThrow(/account status/);
    await expect(
      queryAs(db, mallory, `update public.profiles set email = 'x@example.test' where id = $1`, [mallory]),
    ).rejects.toThrow(/cannot be changed/);
    const ok = await queryAs(
      db,
      mallory,
      `update public.profiles set full_name = 'Mallory' where id = $1 returning id`,
      [mallory],
    );
    expect(ok.rows).toHaveLength(1);
  });

  it("gives each admin role only its assigned permissions", async () => {
    const can = async (user: string, permission: string) => {
      const result = await queryAs<{ allowed: boolean }>(
        db,
        user,
        `select public.has_permission($1) as allowed`,
        [permission],
      );
      return result.rows[0]!.allowed;
    };
    expect(await can(superAdmin, "settings.manage")).toBe(true);
    expect(await can(support, "support.manage")).toBe(true);
    expect(await can(support, "users.manage")).toBe(false);
    expect(await can(content, "themes.manage")).toBe(true);
    expect(await can(content, "users.view")).toBe(false);
  });

  it("lets support read user sites but not moderate them", async () => {
    const read = await queryAs(db, support, `select id from public.websites where id = $1`, [aliceSite]);
    expect(read.rows).toHaveLength(1);
    const update = await queryAs(
      db,
      support,
      `update public.websites set status = 'suspended' where id = $1 returning id`,
      [aliceSite],
    );
    expect(update.rows).toHaveLength(0);
  });

  it("does not let non-super admins assign roles", async () => {
    await expect(
      queryAs(
        db,
        support,
        `insert into public.admin_user_roles (user_id, role_id)
         values ($1, (select id from public.admin_roles where slug = 'super_admin'))`,
        [support],
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("protects the last Super Admin", async () => {
    await expect(
      queryAs(db, superAdmin, `delete from public.admin_user_roles where user_id = $1`, [superAdmin]),
    ).rejects.toThrow(/last Super Admin/);
  });

  it("removes admin rights while an admin account is suspended", async () => {
    const temp = await createUser(db, "temp-admin@example.test");
    await assignRole(db, temp, "platform_admin");
    await queryAs(
      db,
      superAdmin,
      `update public.profiles set account_status = 'suspended' where id = $1`,
      [temp],
    );
    const result = await queryAs<{ allowed: boolean }>(
      db,
      temp,
      `select public.has_permission('users.view') as allowed`,
    );
    expect(result.rows[0]!.allowed).toBe(false);
  });
});

describe("suspended users", () => {
  it("can read their data but not create or change it", async () => {
    const user = await createUser(db, "suspended@example.test");
    const site = await createSite(user, "suspended-site");
    await db.query(`update public.profiles set account_status = 'suspended' where id = $1`, [user]);

    const read = await queryAs(db, user, `select id from public.websites`);
    expect(read.rows).toHaveLength(1);
    await expect(createSite(user, "suspended-two")).rejects.toThrow(/row-level security/);
    const update = await queryAs(
      db,
      user,
      `update public.websites set name = 'x' where id = $1 returning id`,
      [site],
    );
    expect(update.rows).toHaveLength(0);
  });
});

describe("activity log", () => {
  it("records the session's admin as actor and cannot be forged by users", async () => {
    await queryAs(db, superAdmin, `select public.log_activity('admin.login')`);
    const logs = await queryAs<{ actor_email: string }>(
      db,
      superAdmin,
      `select actor_email from public.activity_logs where action = 'admin.login'`,
    );
    expect(logs.rows).toEqual([{ actor_email: "super@example.test" }]);

    await expect(
      queryAs(db, mallory, `select public.log_activity('fake')`),
    ).rejects.toThrow(/Only administrators/);
    await expect(
      queryAs(db, superAdmin, `insert into public.activity_logs (action) values ('fake')`),
    ).rejects.toThrow(/permission denied/);
  });

  it("is append-only even for trusted roles", async () => {
    await expect(db.exec(`delete from public.activity_logs`)).rejects.toThrow(/append-only/);
    await expect(
      db.exec(`update public.activity_logs set action = 'x'`),
    ).rejects.toThrow(/append-only/);
  });

  it("is hidden from admins without the permission", async () => {
    const logs = await queryAs(db, content, `select * from public.activity_logs`);
    expect(logs.rows).toHaveLength(0);
  });
});

describe("marketplace", () => {
  it("shows only published themes to the public", async () => {
    await db.exec(`
      insert into public.themes (name, slug, status) values
        ('Draft', 'draft-theme', 'draft'),
        ('Review', 'review-theme', 'under_review'),
        ('Live', 'live-theme', 'published');
    `);
    const result = await queryAs<{ slug: string }>(
      db,
      VISITOR,
      `select slug from public.themes where slug like '%-theme'`,
    );
    expect(result.rows).toEqual([{ slug: "live-theme" }]);
  });

  it("blocks non-admins from writing themes", async () => {
    await expect(
      queryAs(db, mallory, `insert into public.themes (name, slug) values ('x', 'x-theme')`),
    ).rejects.toThrow(/row-level security/);
    const allowed = await queryAs(
      db,
      content,
      `insert into public.themes (name, slug) values ('Ok', 'ok-theme') returning id`,
    );
    expect(allowed.rows).toHaveLength(1);
  });
});

describe("media and storage", () => {
  it("keeps user files inside the owner's folder", async () => {
    const own = await queryAs(
      db,
      alice,
      `insert into storage.objects (bucket_id, name) values ('user-media', $1) returning id`,
      [`${alice}/logo.png`],
    );
    expect(own.rows).toHaveLength(1);
    await expect(
      queryAs(db, bob, `insert into storage.objects (bucket_id, name) values ('user-media', $1)`, [`${alice}/evil.png`]),
    ).rejects.toThrow(/row-level security/);
    const remove = await queryAs(
      db,
      bob,
      `delete from storage.objects where name = $1 returning id`,
      [`${alice}/logo.png`],
    );
    expect(remove.rows).toHaveLength(0);
  });

  it("does not let an admin modify user files or a user write platform files", async () => {
    const remove = await queryAs(
      db,
      superAdmin,
      `delete from storage.objects where name = $1 returning id`,
      [`${alice}/logo.png`],
    );
    expect(remove.rows).toHaveLength(0);
    await expect(
      queryAs(db, alice, `insert into storage.objects (bucket_id, name) values ('platform-media', 'logo.png')`),
    ).rejects.toThrow(/row-level security/);
  });

  it("keeps theme packages private", async () => {
    await db.exec(`insert into storage.objects (bucket_id, name) values ('theme-packages', 'pkg.zip')`);
    for (const user of [VISITOR, mallory, support]) {
      const result = await queryAs(
        db,
        user,
        `select id from storage.objects where bucket_id = 'theme-packages'`,
      );
      expect(result.rows).toHaveLength(0);
    }
    const admin = await queryAs(
      db,
      content,
      `select id from storage.objects where bucket_id = 'theme-packages'`,
    );
    expect(admin.rows).toHaveLength(1);
  });
});
