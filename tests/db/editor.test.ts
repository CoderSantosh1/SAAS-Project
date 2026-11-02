import { beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { assignRole, createTestDb, createUser, queryAs, type TestDb } from "./setup";

type Section = { id: string; type: string; props: Record<string, unknown>; design: Record<string, unknown>; isVisible: boolean };
type Page = { id: string; title: string; slug: string; isHome: boolean; isVisible: boolean; seo: object; sections: Section[] };
type Doc = { name: string; businessName: string | null; design: Record<string, unknown>; pages: Page[] };
type Editor = { id: string; revision: number; status: string; document: Doc };

let db: TestDb;
let alice: string;
let bob: string;
let support: string;

async function newSite(user: string, slug: string) {
  const result = await queryAs<{ id: string }>(
    db,
    user,
    `select public.create_website(p_theme_slug => 'hearth', p_name => 'Site', p_slug => $1) as id`,
    [slug],
  );
  return result.rows[0]!.id;
}

async function load(user: string, id: string) {
  const result = await queryAs<{ editor: Editor | null }>(
    db,
    user,
    `select public.get_website_editor($1) as editor`,
    [id],
  );
  return result.rows[0]!.editor;
}

async function save(user: string, id: string, revision: number, document: unknown) {
  const result = await queryAs<{ revision: number }>(
    db,
    user,
    `select public.save_website_draft($1, $2, $3::jsonb) as revision`,
    [id, revision, JSON.stringify(document)],
  );
  return result.rows[0]!.revision;
}

beforeAll(async () => {
  db = await createTestDb();
  alice = await createUser(db, "alice@example.test");
  bob = await createUser(db, "bob@example.test");
  support = await createUser(db, "support@example.test");
  await assignRole(db, support, "support_admin");
}, 60_000);

describe("save_website_draft", () => {
  it("round-trips edits, ordering, design and metadata, and bumps the revision", async () => {
    const id = await newSite(alice, "round-trip");
    const { document, revision } = (await load(alice, id))!;
    const home = document.pages[0]!;
    const [first, second] = home.sections;
    first!.props.heading = "Edited heading";
    first!.design = { paddingY: "lg" };
    home.sections = [second!, first!, ...home.sections.slice(2)];
    document.name = "Renamed";
    document.businessName = "New Business";
    document.design = { primary: "#123456" };

    expect(await save(alice, id, revision, document)).toBe(revision + 1);

    const saved = (await load(alice, id))!;
    expect(saved.document).toEqual(document);
    expect(saved.revision).toBe(revision + 1);
  });

  it("adds and removes pages and sections", async () => {
    const id = await newSite(alice, "add-remove");
    const { document, revision } = (await load(alice, id))!;
    const removed = document.pages.pop()!;
    document.pages[0]!.sections.shift();
    document.pages[0]!.sections.push({ id: randomUUID(), type: "cta", props: { heading: "New" }, design: {}, isVisible: false });
    document.pages.push({ id: randomUUID(), title: "Extra", slug: "extra", isHome: false, isVisible: false, seo: { title: "T" }, sections: [] });

    await save(alice, id, revision, document);

    const saved = (await load(alice, id))!;
    expect(saved.document).toEqual(document);
    expect(saved.document.pages.map((page) => page.id)).not.toContain(removed.id);
  });

  it("lets pages swap slugs and moves the homepage", async () => {
    const id = await newSite(alice, "swap-home");
    const { document, revision } = (await load(alice, id))!;
    const [a, b] = document.pages;
    [a!.slug, b!.slug] = [b!.slug, a!.slug];
    a!.isHome = false;
    b!.isHome = true;

    await save(alice, id, revision, document);
    expect((await load(alice, id))!.document).toEqual(document);
  });

  it("refuses a stale revision, keeping the newer work", async () => {
    const id = await newSite(alice, "stale");
    const { document, revision } = (await load(alice, id))!;
    await save(alice, id, revision, { ...document, name: "Newer" });

    await expect(save(alice, id, revision, { ...document, name: "Older" })).rejects.toThrow(/changed somewhere else/);
    expect((await load(alice, id))!.document.name).toBe("Newer");
  });

  it("changes nothing when part of the save fails", async () => {
    const id = await newSite(alice, "atomic");
    const before = (await load(alice, id))!;
    const broken = structuredClone(before.document);
    broken.name = "Should not stick";
    broken.pages[1]!.slug = broken.pages[0]!.slug;

    await expect(save(alice, id, before.revision, broken)).rejects.toThrow(/unique/);
    expect(await load(alice, id)).toEqual(before);
  });

  it("requires exactly one homepage and at least one page", async () => {
    const id = await newSite(alice, "one-home");
    const { document, revision } = (await load(alice, id))!;
    const none = structuredClone(document);
    none.pages[0]!.isHome = false;
    await expect(save(alice, id, revision, none)).rejects.toThrow(/exactly one homepage/);
    const two = structuredClone(document);
    two.pages[1]!.isHome = true;
    await expect(save(alice, id, revision, two)).rejects.toThrow(/exactly one homepage/);
    await expect(save(alice, id, revision, { ...document, pages: [] })).rejects.toThrow(/between 1 and 50/);
  });

  it("does not touch publishing state or a published snapshot", async () => {
    const id = await newSite(alice, "live-site");
    const version = await db.query<{ id: string }>(
      `insert into public.website_versions (website_id, version_number, snapshot) values ($1, 1, '{"heading":"live"}') returning id`,
      [id],
    );
    await db.query(`update public.websites set status = 'published', published_version_id = $1 where id = $2`, [version.rows[0]!.id, id]);

    const { document, revision } = (await load(alice, id))!;
    document.pages[0]!.sections[0]!.props.heading = "secret draft edit";
    await save(alice, id, revision, document);

    const live = await queryAs<{ site: { snapshot: unknown } }>(db, null, `select public.get_published_site('live-site') as site`);
    expect(live.rows[0]!.site.snapshot).toEqual({ heading: "live" });
    expect((await load(alice, id))!.status).toBe("published");
  });
});

describe("editor access", () => {
  it("does not let another user or an admin load or save a draft", async () => {
    const id = await newSite(alice, "private-editor");
    const { document, revision } = (await load(alice, id))!;
    for (const user of [bob, support]) {
      expect(await load(user, id)).toBeNull();
      await expect(save(user, id, revision, document)).rejects.toThrow(/not found/);
    }
  });

  it("does not let a user take another user's page or section by its id", async () => {
    const victim = await newSite(alice, "victim-site");
    const victimDoc = (await load(alice, victim))!.document;
    const attacker = await newSite(bob, "attacker-site");
    const { document, revision } = (await load(bob, attacker))!;

    const stealPage = structuredClone(document);
    stealPage.pages.push({ ...victimDoc.pages[1]!, slug: "stolen", sections: [] });
    await expect(save(bob, attacker, revision, stealPage)).rejects.toThrow(/row-level security|violates|permission/);

    const stealSection = structuredClone(document);
    stealSection.pages[0]!.sections.push(victimDoc.pages[0]!.sections[0]!);
    await expect(save(bob, attacker, revision, stealSection)).rejects.toThrow(/row-level security|violates|permission/);

    expect((await load(alice, victim))!.document).toEqual(victimDoc);
  });

  it("blocks visitors and suspended users", async () => {
    const id = await newSite(alice, "blocked-site");
    for (const call of [
      `select public.get_website_editor('${id}')`,
      `select public.save_website_draft('${id}', 0, '{}')`,
      `select public.create_website_checkpoint('${id}')`,
    ]) {
      await expect(queryAs(db, null, call)).rejects.toThrow(/permission denied/);
    }

    const suspended = await createUser(db, "suspended@example.test");
    const site = await newSite(suspended, "suspended-editor");
    const { document, revision } = (await load(suspended, site))!;
    await db.query(`update public.profiles set account_status = 'suspended' where id = $1`, [suspended]);
    await expect(save(suspended, site, revision, { ...document, name: "x" })).rejects.toThrow(/not found/);
    await expect(
      queryAs(db, suspended, `select public.create_website_checkpoint($1)`, [site]),
    ).rejects.toThrow(/not found/);
  });
});

describe("create_website_checkpoint", () => {
  const checkpoint = async (user: string, id: string, label?: string) =>
    (await queryAs<{ id: string }>(db, user, `select public.create_website_checkpoint($1, $2) as id`, [id, label ?? null])).rows[0]!.id;

  it("stores the saved draft as a restore point visible only to the owner", async () => {
    const id = await newSite(alice, "history");
    const { document } = (await load(alice, id))!;
    const versionId = await checkpoint(alice, id, "Before redesign");

    const own = await queryAs<{ snapshot: Doc; kind: string; label: string }>(
      db,
      alice,
      `select snapshot, kind, label from public.website_versions where id = $1`,
      [versionId],
    );
    expect(own.rows[0]).toEqual({ snapshot: document, kind: "checkpoint", label: "Before redesign" });

    const other = await queryAs(db, bob, `select id from public.website_versions where id = $1`, [versionId]);
    expect(other.rows).toHaveLength(0);
    await expect(checkpoint(bob, id)).rejects.toThrow(/not found/);
  });

  it("keeps only the newest 50 checkpoints, and never prunes published versions", async () => {
    const id = await newSite(alice, "prune");
    await db.query(`insert into public.website_versions (website_id, version_number, snapshot) values ($1, 1, '{}')`, [id]);
    for (let index = 0; index < 52; index += 1) await checkpoint(alice, id);

    const rows = await db.query<{ kind: string; count: number; oldest: number }>(
      `select kind, count(*)::int as count, min(version_number) as oldest from public.website_versions where website_id = $1 group by kind`,
      [id],
    );
    expect(rows.rows).toContainEqual({ kind: "published", count: 1, oldest: 1 });
    expect(rows.rows).toContainEqual({ kind: "checkpoint", count: 50, oldest: 4 });
  });

  it("is never served to visitors as the live site", async () => {
    const id = await newSite(alice, "not-public");
    await checkpoint(alice, id);
    const live = await queryAs<{ site: unknown }>(db, null, `select public.get_published_site('not-public') as site`);
    expect(live.rows[0]!.site).toBeNull();
  });
});
