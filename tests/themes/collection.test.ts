import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { collectionArt } from "@/themes/collection/art";
import { ART_FILES } from "@/themes/collection/build";
import { contrast, deriveTokens, mix } from "@/themes/collection/colors";
import { COLLECTION_PROFILES, COLLECTION_THEMES } from "@/themes/collection";
import { CATEGORY_PROFILES, INDIA_PROFILES } from "@/themes/collection/profiles";
import { CRESTVIEW_COPY } from "@/themes/implementations/crestview/copy";
import { SPROUTS_COPY } from "@/themes/implementations/sprouts/copy";
import { createStarterDocument, getTheme, listThemeDefinitions } from "@/themes/registry";
import { findPage, SiteRenderer } from "@/themes/renderer";
import { INDUSTRY_ICONS } from "@/themes/shared/icons";
import { findCtaLink } from "@/themes/shared/links";
import { createTestDb, createUser, assignRole, queryAs, type TestDb } from "../db/setup";

// The 50 seeded marketplace categories (supabase/migrations/..._reference_data_and_grants.sql).
const CATEGORY_NAMES = [
  "Business", "Corporate", "Digital Agency", "IT Company", "Portfolio", "Developer Portfolio",
  "Photography", "Architecture", "Hospital", "Medical Clinic", "IVF Center", "Dental Clinic",
  "Pharmacy", "School", "College", "Coaching Institute", "Online Education", "Restaurant",
  "Cafe", "Bakery", "Hotel", "Travel Agency", "Tourism", "E-commerce", "Fashion", "Electronics",
  "Furniture", "Grocery", "Law Firm", "Real Estate", "Interior Design", "Construction",
  "Financial Services", "Insurance", "Wedding Planner", "Event Management", "NGO", "Fitness",
  "Gym", "Yoga", "Automobile", "Car Rental", "News", "Magazine", "Blog", "Entertainment",
  "Salon", "Spa", "Personal Branding", "Consulting",
];
const ORIGINAL_SLUGS = CATEGORY_NAMES.map((name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
// Added for the India collection (supabase/migrations/..._india_categories.sql).
const INDIA_CATEGORY_SLUGS = ["training-institute", "chartered-accountant", "sweet-shop", "jewellery", "temple"];
const CATEGORY_SLUGS = [...ORIGINAL_SLUGS, ...INDIA_CATEGORY_SLUGS];

// Wording that belongs to the school themes and must not leak into other industries.
const SCHOOL_WORDS = [
  CRESTVIEW_COPY.announcement,
  CRESTVIEW_COPY.headerCta,
  CRESTVIEW_COPY.footerTagline,
  SPROUTS_COPY.headerCta,
  SPROUTS_COPY.footerTagline,
  SPROUTS_COPY.footerNote,
];

function renderHome(slug: string) {
  const definition = listThemeDefinitions().find((candidate) => candidate.slug === slug)!;
  const document = createStarterDocument(definition);
  return renderToStaticMarkup(createElement(SiteRenderer, { document, page: findPage(document)! }));
}

describe("theme collection", () => {
  it("has one theme for each original category", () => {
    expect(CATEGORY_PROFILES.map((profile) => profile.category).sort()).toEqual([...ORIGINAL_SLUGS].sort());
  });

  it("has at least 30 India themes, covering schools, coaching, training and media", () => {
    expect(INDIA_PROFILES.length).toBeGreaterThanOrEqual(30);
    const categories = INDIA_PROFILES.map((profile) => profile.category);
    for (const kind of ["school", "coaching-institute", "training-institute", "news", "entertainment", ...INDIA_CATEGORY_SLUGS]) {
      expect(categories, kind).toContain(kind);
    }
    expect(COLLECTION_THEMES.length).toBe(CATEGORY_PROFILES.length + INDIA_PROFILES.length);
  });

  it("gives every marketplace category, old and new, at least one theme", () => {
    const covered = new Set(COLLECTION_PROFILES.flatMap((profile) => [profile.category, ...(profile.categories ?? [])]));
    for (const slug of CATEGORY_SLUGS) expect(covered.has(slug), slug).toBe(true);
  });

  it("creates the India categories in a migration", () => {
    const sql = readFileSync(join(process.cwd(), "supabase", "migrations", "20261107000019_india_categories.sql"), "utf8");
    for (const slug of INDIA_CATEGORY_SLUGS) expect(sql).toContain(`'${slug}'`);
    expect(sql).toContain("on conflict (slug) do nothing");
  });

  it("only lists categories that exist", () => {
    for (const { definition } of COLLECTION_THEMES) {
      for (const category of definition.categories) expect(CATEGORY_SLUGS, `${definition.slug}: ${category}`).toContain(category);
      expect(new Set(definition.categories).size, `${definition.slug} repeats a category`).toBe(definition.categories.length);
    }
  });

  it("uses unique slugs and names that do not clash with other themes", () => {
    const all = listThemeDefinitions();
    expect(new Set(all.map((definition) => definition.slug)).size).toBe(all.length);
    expect(new Set(all.map((definition) => definition.componentId)).size).toBe(all.length);
    expect(new Set(all.map((definition) => definition.name.toLowerCase())).size).toBe(all.length);
    for (const { definition } of COLLECTION_THEMES) {
      expect(definition.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      // An ampersand is escaped in HTML, which breaks the site name in page titles and tests.
      expect(definition.name, definition.slug).not.toMatch(/[&<>"]/);
    }
  });

  it("is built on the two base designs, with both used", () => {
    const families = COLLECTION_THEMES.map(({ components }) => components.family);
    expect(new Set(families)).toEqual(new Set(["crestview", "sprouts"]));
    expect(families.filter((family) => family === "sprouts").length).toBeGreaterThanOrEqual(15);
    expect(families.filter((family) => family === "crestview").length).toBeGreaterThanOrEqual(15);
  });

  it("only uses icons that every base design can draw", () => {
    for (const profile of COLLECTION_PROFILES) {
      for (const icon of profile.icons) expect(Object.hasOwn(INDUSTRY_ICONS, icon), `${profile.slug}: ${icon}`).toBe(true);
    }
  });

  it("has a distinct look for every theme", () => {
    const looks = COLLECTION_THEMES.map(({ definition, components }) => `${definition.tokens.primary}-${components.family}-${definition.tokens.headingFont}`);
    expect(new Set(looks).size).toBe(looks.length);
  });

  describe.each(COLLECTION_PROFILES.map((profile) => [profile.slug, profile] as const))("%s", (slug, profile) => {
    const html = renderHome(slug);

    it("renders with its base design's stylesheet and its own colors", () => {
      expect(html).toContain(`data-theme="${slug}"`);
      expect(html).toContain(`data-theme-family="${profile.base}"`);
      const variable = profile.base === "crestview" ? `--cv-gold:${profile.accent}` : `--sp-sun:${profile.accent}`;
      expect(html).toContain(variable);
    });

    it("uses its own wording, not the school themes'", () => {
      expect(html).toContain(profile.copy.cta);
      expect(html).toContain(profile.copy.tagline);
      for (const words of SCHOOL_WORDS) expect(html, words).not.toContain(words);
    });

    it("points the header button at the contact page", () => {
      expect(html).toMatch(new RegExp(`href="/contact"[^>]*>${profile.copy.cta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<`));
    });
  });
});

describe("base designs keep their own wording", () => {
  it("Crestview", () => {
    const html = renderHome("crestview");
    expect(html).toContain(CRESTVIEW_COPY.announcement);
    expect(html).toContain(CRESTVIEW_COPY.headerCta);
    expect(html).toContain('data-theme-family="crestview"');
  });

  it("Little Sprouts", () => {
    const html = renderHome("sprouts");
    expect(html).toContain(SPROUTS_COPY.headerCta);
    expect(html).toContain(SPROUTS_COPY.footerNote);
    expect(html).toContain('data-theme-family="sprouts"');
  });

  it("scopes the shared stylesheets to the family attribute only", () => {
    for (const family of ["crestview", "sprouts"]) {
      const css = readFileSync(join(process.cwd(), "src", "themes", "implementations", family, "styles.css"), "utf8");
      expect(css).not.toContain(`[data-theme="${family}"]`);
      expect(css).toContain(`[data-theme-family="${family}"]`);
    }
  });

  it("finds the call-to-action link by page slug, in navigation order", () => {
    const links = [{ href: "/sites/x" }, { href: "/sites/x/admissions" }, { href: "/sites/x/contact" }];
    expect(findCtaLink(links, ["contact", "admissions"])).toBe(links[1]);
    expect(findCtaLink(links, ["enroll"])).toBeUndefined();
    expect(findCtaLink([{ href: "/my-contact" }], ["contact"])).toBeUndefined();
  });
});

describe("collection artwork", () => {
  it.each(COLLECTION_PROFILES.map((profile) => [profile.slug, profile] as const))("%s is generated and up to date", (slug, profile) => {
    const theme = getTheme(slug, "1.0.0")!;
    const expected = collectionArt(profile, theme.definition.tokens.primary);
    for (const name of ART_FILES) {
      const file = join(process.cwd(), "public", "themes", slug, `${name}.svg`);
      expect(existsSync(file), `${file}: run pnpm themes:art`).toBe(true);
      expect(readFileSync(file, "utf8"), `${slug}/${name}.svg is stale: run pnpm themes:art`).toBe(expected[name]);
    }
  });

  it("contains no scripts, links or remote references", () => {
    for (const profile of COLLECTION_PROFILES) {
      for (const svg of Object.values(collectionArt(profile, "#123456"))) {
        expect(svg).not.toMatch(/<script|<foreignObject|href=|javascript:|url\((?!#)/i);
      }
    }
  });

  it("leaves no stray files in collection image folders", () => {
    for (const profile of COLLECTION_PROFILES) {
      const files = readdirSync(join(process.cwd(), "public", "themes", profile.slug)).sort();
      expect(files).toEqual(ART_FILES.map((name) => `${name}.svg`).sort());
    }
  });
});

describe("collection colors", () => {
  it("derives readable tokens from any primary color", () => {
    const samples = ["#FFFF00", "#FFFFFF", "#000000", "#00FFAA", "#FF7A59", "#7CE3B5", "#123456", "#E0B04A"];
    for (const primary of samples) {
      const tokens = deriveTokens({ primary, headingFont: "inter", bodyFont: "inter", radius: "md" });
      expect(contrast(tokens.onPrimary, tokens.primary), primary).toBeGreaterThanOrEqual(4.5);
      for (const bg of [tokens.background, tokens.surface]) {
        expect(contrast(tokens.text, bg), primary).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens.mutedText, bg), primary).toBeGreaterThanOrEqual(4.5);
      }
      for (const value of Object.values(tokens).filter((value) => value.startsWith("#"))) expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("mixes colors predictably", () => {
    expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(mix("#123456", "#123456", 0.3)).toBe("#123456");
  });
});

describe("collection in the database", () => {
  let db: TestDb;
  let admin: string;

  beforeAll(async () => {
    db = await createTestDb();
    admin = await createUser(db, "collection-admin@example.test");
    await assignRole(db, admin, "content_manager");
  }, 120_000);

  it("arrives for review, hidden from visitors", async () => {
    const slugs = COLLECTION_PROFILES.map((profile) => profile.slug);
    const rows = await db.query<{ slug: string; status: string }>(`select slug, status from public.themes where slug = any($1)`, [slugs]);
    expect(rows.rows).toHaveLength(slugs.length);
    expect(new Set(rows.rows.map((row) => row.status))).toEqual(new Set(["under_review"]));
    const visible = await queryAs<{ theme_slug: string }>(db, null, `select theme_slug from public.list_marketplace_templates(null, null, false, 100)`);
    expect(visible.rows.map((row) => row.theme_slug)).not.toContain(slugs[0]);
  });

  it("can be published in bulk and then fills every category in the marketplace", async () => {
    const ids = await db.query<{ id: string }>(`select id from public.themes where status = 'under_review' and slug = any($1)`, [COLLECTION_PROFILES.map((profile) => profile.slug)]);
    for (const { id } of ids.rows) {
      await queryAs(db, admin, `select public.set_theme_status($1, 'published'::public.theme_status)`, [id]);
    }
    const visible = await queryAs<{ theme_slug: string }>(db, null, `select theme_slug from public.list_marketplace_templates(null, null, false, 100)`);
    const slugs = visible.rows.map((row) => row.theme_slug);
    for (const profile of COLLECTION_PROFILES) expect(slugs, profile.slug).toContain(profile.slug);

    const categories = await queryAs<{ slug: string; template_count: string }>(db, null, `select slug, template_count from public.list_public_categories()`);
    for (const slug of CATEGORY_SLUGS) {
      const row = categories.rows.find((category) => category.slug === slug);
      expect(Number(row?.template_count), slug).toBeGreaterThanOrEqual(1);
    }
  });

  it("lists a collection theme under its category and finds it by name", async () => {
    const list = async (category: string | null, search: string | null) =>
      (await queryAs<{ theme_slug: string }>(db, null, `select theme_slug from public.list_marketplace_templates($1, $2, false, 100)`, [category, search])).rows.map(
        (row) => row.theme_slug,
      );
    expect(await list("restaurant", null)).toContain("saffron-table");
    expect(await list("restaurant", null)).not.toContain("iron-yard");
    expect(await list(null, "saffron")).toContain("saffron-table");
    expect(await list(null, "saffron table")).toEqual(["saffron-table"]);
  });
});
