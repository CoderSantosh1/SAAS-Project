import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createStarterDocument, getTheme, listThemeDefinitions } from "@/themes/registry";
import { findPage, parseSiteDocument, renderSectionContent, SiteRenderer } from "@/themes/renderer";
import { getSectionDefinition, listSectionDefinitions } from "@/themes/sections";
import { sectionSchemas, type SiteDocument } from "@/themes/types";
import { z } from "zod";
import { createTestDb, queryAs, type TestDb } from "../db/setup";

const definitions = listThemeDefinitions();
const [firstTheme] = definitions;

function render(document: SiteDocument, slug?: string) {
  const page = findPage(document, slug);
  if (!page) throw new Error("page not found");
  return renderToStaticMarkup(createElement(SiteRenderer, { document, page }));
}

function documentWithSections(sections: { type: string; props: unknown; isVisible?: boolean }[]) {
  const document = createStarterDocument(firstTheme!);
  document.pages[0]!.sections = sections.map((section) => ({ isVisible: true, ...section }));
  return document;
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

describe.each(definitions)("theme $name", (definition) => {
  const document = createStarterDocument(definition);

  it("is registered under its exact version", () => {
    expect(getTheme(definition.componentId, definition.version)?.definition).toBe(definition);
  });

  it("has exactly one homepage and unique page slugs", () => {
    expect(definition.pages.filter((page) => page.isHome)).toHaveLength(1);
    const slugs = definition.pages.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("produces a valid document whose starter content passes every schema", () => {
    expect(parseSiteDocument(document)).not.toBeNull();
    const theme = getTheme(definition.componentId, definition.version);
    for (const page of definition.pages) {
      for (const section of page.sections) {
        const sectionDefinition = getSectionDefinition(theme, section.type);
        expect(sectionDefinition, `${page.slug}/${section.type} is a known type`).not.toBeNull();
        const result = sectionDefinition!.schema.safeParse(section.props);
        expect(result.success, `${page.slug}/${section.type}: ${JSON.stringify(result.error?.issues[0])}`).toBe(true);
      }
    }
  });

  it("renders every section of every page", () => {
    const theme = getTheme(definition.componentId, definition.version)!;
    for (const page of definition.pages) {
      const html = render(document, page.isHome ? undefined : page.slug);
      expect(html, page.slug).toContain(document.siteName);
      for (const section of page.sections) {
        const markup = renderToStaticMarkup(createElement("div", null, renderSectionContent(theme, section, (href) => href)));
        expect(markup.length, `${page.slug}/${section.type} rendered nothing`).toBeGreaterThan(20);
      }
    }
  });

  it("gives every page exactly one h1", () => {
    for (const page of definition.pages) {
      const html = render(document, page.isHome ? undefined : page.slug);
      expect(html.match(/<h1[\s>]/g)?.length, page.slug).toBe(1);
    }
  });

  it("declares valid custom sections", () => {
    const theme = getTheme(definition.componentId, definition.version)!;
    for (const [type, section] of Object.entries(theme.components.customSections ?? {})) {
      expect(type, "lowercase with hyphens").toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
      expect(Object.hasOwn(sectionSchemas, type), `${type} reuses a built-in type`).toBe(false);
      expect(section.label.trim(), `${type} label`).not.toBe("");
      const defaults = section.schema.safeParse(section.defaults);
      expect(defaults.success, `${type} defaults: ${JSON.stringify(defaults.error?.issues[0])}`).toBe(true);
      const shape = (section.schema as unknown as { shape?: Record<string, unknown> }).shape ?? {};
      for (const field of section.fields) {
        expect(Object.hasOwn(shape, field.key), `${type} field "${field.key}" is not in its schema`).toBe(true);
      }
      expect(z.toJSONSchema(section.schema, { unrepresentable: "any" })).toBeTruthy();
    }
  });

  it("only links to pages that exist", () => {
    const known = new Set(["/", ...definition.pages.map((page) => `/${page.slug}`)]);
    for (const page of definition.pages) {
      const hrefs = JSON.stringify(page.sections).matchAll(/"href":"([^"]+)"/g);
      for (const [, href] of hrefs) {
        expect(known.has(href!), `${page.slug} -> ${href}`).toBe(true);
      }
    }
  });

  it("uses sample images that exist", () => {
    const sources = JSON.stringify(definition.pages).matchAll(/"src":"([^"]+)"/g);
    for (const [, src] of sources) {
      expect(existsSync(join(process.cwd(), "public", src!)), src).toBe(true);
    }
  });

  it("meets WCAG AA contrast for text and buttons", () => {
    const { tokens } = definition;
    expect(contrast(tokens.text, tokens.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.mutedText, tokens.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.text, tokens.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.mutedText, tokens.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens.onPrimary, tokens.primary)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("renderer safety", () => {
  const validHero = { heading: "Safe heading" };

  it("escapes HTML in user content", () => {
    const html = render(documentWithSections([{ type: "hero", props: { heading: "<script>alert(1)</script>" } }]));
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "//evil.example", "/\\evil.example"])(
    "skips a section whose link is %s",
    (href) => {
      const html = render(
        documentWithSections([
          { type: "hero", props: { heading: "Unsafe", primaryButton: { label: "Go", href } } },
          { type: "hero", props: validHero },
        ]),
      );
      expect(html).not.toContain("Unsafe");
      expect(html).toContain("Safe heading");
    },
  );

  it("rejects unsafe image URLs", () => {
    for (const src of ["javascript:alert(1)", "data:image/svg+xml,x", "//evil.example/x.png"]) {
      const result = sectionSchemas.hero.safeParse({ heading: "x", image: { src, alt: "" } });
      expect(result.success, src).toBe(false);
    }
  });

  it("ignores unknown section types and prototype keys", () => {
    const html = render(
      documentWithSections([
        { type: "custom-code", props: { heading: "Injected" } },
        { type: "constructor", props: {} },
        { type: "__proto__", props: {} },
        { type: "hero", props: validHero },
      ]),
    );
    expect(html).not.toContain("Injected");
    expect(html).toContain("Safe heading");
  });

  it("skips invalid and hidden sections without failing the page", () => {
    const html = render(
      documentWithSections([
        { type: "stats", props: { items: "not an array" } },
        { type: "hero", props: { heading: "Hidden one" }, isVisible: false },
        { type: "hero", props: validHero },
      ]),
    );
    expect(html).not.toContain("Hidden one");
    expect(html).toContain("Safe heading");
  });

  it.each([
    ["a CSS injection", { primary: "red;background:url(//evil.example)" }],
    ["a short hex value", { primary: "#fff" }],
    ["an unapproved font", { headingFont: "evil-font" }],
  ])("rejects tokens with %s", (_name, override) => {
    const document = createStarterDocument(firstTheme!);
    expect(parseSiteDocument({ ...document, tokens: { ...document.tokens, ...override } })).toBeNull();
  });

  it("renders nothing for an unregistered theme or version", () => {
    for (const change of [{ themeId: "uploaded-code" }, { themeVersion: "9.9.9" }]) {
      const document = { ...createStarterDocument(firstTheme!), ...change };
      expect(render(document)).toBe("");
    }
  });

  it("does not serve hidden pages or reach the homepage by its slug", () => {
    const document = createStarterDocument(firstTheme!);
    const [home, about] = document.pages;
    about!.isVisible = false;
    expect(findPage(document, about!.slug)).toBeNull();
    expect(findPage(document, home!.slug)).toBeNull();
    expect(findPage(document, "missing")).toBeNull();
    expect(findPage(document)).toBe(home);
    expect(render(document)).not.toContain(`/${about!.slug}"`);
  });

  it("prefixes internal links with the base path only", () => {
    const document = documentWithSections([
      {
        type: "hero",
        props: {
          heading: "Links",
          primaryButton: { label: "Inside", href: "/contact" },
          secondaryButton: { label: "Outside", href: "https://example.com/x" },
        },
      },
    ]);
    const html = renderToStaticMarkup(
      createElement(SiteRenderer, { document, page: findPage(document)!, basePath: "/sites/demo" }),
    );
    expect(html).toContain('href="/sites/demo/contact"');
    expect(html).toContain('href="https://example.com/x"');
  });
});

describe("database seed", () => {
  let db: TestDb;

  beforeAll(async () => {
    db = await createTestDb();
  }, 60_000);

  // Read directly, because a new code theme starts in review and visitors cannot see it.
  it("has a database row for every registered theme, matching the code", async () => {
    for (const definition of definitions) {
      const result = await db.query<{ component_id: string; component_version: string; version: string; design_tokens: unknown; current: boolean }>(
        `select v.component_id, v.component_version, v.version, v.design_tokens, t.current_version_id = v.id as current
         from public.theme_versions v join public.themes t on t.id = v.theme_id
         where t.slug = $1`,
        [definition.slug],
      );
      expect(result.rows, `${definition.slug}: run pnpm themes:seed`).toEqual([
        {
          component_id: definition.componentId,
          component_version: definition.version,
          version: definition.version,
          design_tokens: definition.tokens,
          current: true,
        },
      ]);
    }
  });

  it("gives each theme a template in its categories", async () => {
    for (const definition of definitions) {
      const result = await db.query<{ slug: string }>(
        `select c.slug from public.template_categories tc
         join public.categories c on c.id = tc.category_id
         join public.templates t on t.id = tc.template_id
         where t.slug = $1`,
        [definition.slug],
      );
      expect(result.rows.map((row) => row.slug).sort(), definition.slug).toEqual([...definition.categories].sort());
    }
  });

  it("lists all section types with a schema for the editor", async () => {
    const result = await queryAs<{ section_type: string; props_schema: { type?: string } }>(
      db,
      null,
      `select section_type, props_schema from public.theme_sections s
       join public.theme_versions v on v.id = s.theme_version_id
       where v.component_id = $1`,
      [firstTheme!.componentId],
    );
    const theme = getTheme(firstTheme!.componentId, firstTheme!.version);
    expect(result.rows.map((row) => row.section_type).sort()).toEqual(
      listSectionDefinitions(theme).map((definition) => definition.type).sort(),
    );
    expect(result.rows.every((row) => row.props_schema.type === "object")).toBe(true);
  });
});
