import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { browseHref, CategoryChips, paginate, Pagination, TEMPLATES_PER_PAGE } from "@/components/public/template-browse";
import type { PublicCategory } from "@/features/marketplace/queries";

const category = (slug: string, count: number): PublicCategory => ({
  id: slug,
  name: slug[0]!.toUpperCase() + slug.slice(1),
  slug,
  description: null,
  thumbnail_url: null,
  is_featured: false,
  template_count: count,
});

describe("template gallery links", () => {
  it("builds clean, shareable URLs", () => {
    expect(browseHref("/templates", {})).toBe("/templates");
    expect(browseHref("/templates", { page: 1 })).toBe("/templates");
    expect(browseHref("/templates", { q: "spa & salon", category: "spa", page: 3 })).toBe("/templates?q=spa+%26+salon&category=spa&page=3");
  });
});

describe("pagination", () => {
  const items = Array.from({ length: 57 }, (_, index) => index);

  it("splits items into pages and clamps out-of-range pages", () => {
    expect(paginate(items, 1)).toMatchObject({ page: 1, pageCount: 5 });
    expect(paginate(items, 1).items).toHaveLength(TEMPLATES_PER_PAGE);
    expect(paginate(items, 5).items).toEqual([48, 49, 50, 51, 52, 53, 54, 55, 56]);
    expect(paginate(items, 99).page).toBe(5);
    expect(paginate(items, -2).page).toBe(1);
    expect(paginate([], 1)).toEqual({ items: [], page: 1, pageCount: 1 });
  });

  it("renders nothing for a single page and marks the current page", () => {
    expect(renderToStaticMarkup(createElement(Pagination, { basePath: "/templates", filters: {}, page: 1, pageCount: 1 }))).toBe("");
    const html = renderToStaticMarkup(createElement(Pagination, { basePath: "/templates", filters: { category: "spa" }, page: 2, pageCount: 3 }));
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/templates?category=spa&amp;page=3"');
    expect(html).toContain('href="/templates?category=spa"');
  });
});

describe("category chips", () => {
  it("shows only categories with templates, keeps the search, and marks the active one", () => {
    const html = renderToStaticMarkup(
      createElement(CategoryChips, {
        basePath: "/templates",
        categories: [category("spa", 2), category("gym", 0), category("hotel", 1)],
        q: "calm",
        category: "spa",
        total: 3,
      }),
    );
    expect(html).toContain('href="/templates?q=calm&amp;category=spa"');
    expect(html).toContain('href="/templates?q=calm&amp;category=hotel"');
    expect(html).not.toContain("category=gym");
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="page"[^>]*>Spa/);
  });
});
