import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { withChildren } from "./render";
import { Globe } from "lucide-react";
import { describe, expect, it } from "vitest";
import { DataTable, StatCard, StatusBadge } from "@/components/admin/admin-ui";
import { AuthCard } from "@/components/shared/auth-card";
import { EmptyState } from "@/components/shared/empty-state";
import { countByTab, filterWebsites } from "@/features/websites/filter";

const render = (element: ReturnType<typeof createElement>) => renderToStaticMarkup(element);

describe("website filters", () => {
  const websites = [
    { name: "Saffron Kitchen", slug: "saffron", status: "published", theme_name: "Saffron Table", category_name: "Restaurant" },
    { name: "My Studio", slug: "studio", status: "draft", theme_name: "Folio Studio", category_name: "Portfolio" },
    { name: "Old Shop", slug: "old-shop", status: "unpublished", theme_name: null, category_name: null },
  ];

  it("filters by status tab", () => {
    expect(filterWebsites(websites, { status: "all" })).toHaveLength(3);
    expect(filterWebsites(websites, {}).map((website) => website.slug)).toEqual(["saffron", "studio", "old-shop"]);
    expect(filterWebsites(websites, { status: "draft" }).map((website) => website.slug)).toEqual(["studio"]);
  });

  it("searches name, address, theme and category, ignoring case and spaces", () => {
    expect(filterWebsites(websites, { q: "  SAFFRON " }).map((website) => website.slug)).toEqual(["saffron"]);
    expect(filterWebsites(websites, { q: "portfolio" }).map((website) => website.slug)).toEqual(["studio"]);
    expect(filterWebsites(websites, { q: "old-shop" }).map((website) => website.slug)).toEqual(["old-shop"]);
    expect(filterWebsites(websites, { q: "kitchen", status: "draft" })).toEqual([]);
  });

  it("counts each tab", () => {
    expect(countByTab(websites)).toEqual({ all: 3, published: 1, draft: 1, unpublished: 1 });
    expect(countByTab([])).toEqual({ all: 0, published: 0, draft: 0, unpublished: 0 });
  });
});

describe("admin building blocks", () => {
  it("links a stat card when it has a destination", () => {
    const linked = render(createElement(StatCard, { stat: { label: "Websites", value: 12, icon: Globe, href: "/admin/websites" } }));
    expect(linked).toContain('href="/admin/websites"');
    expect(linked).toContain("Websites");
    expect(linked).toContain("<svg");
    const plain = render(createElement(StatCard, { stat: { label: "Featured", value: 3 } }));
    expect(plain).not.toContain("<a");
  });

  it("labels statuses in plain words", () => {
    const html = render(createElement(StatusBadge, { status: "under_review" }));
    expect(html).toContain("under review");
    expect(html).toContain('aria-hidden="true"');
  });

  it("shows an empty state inside an empty table and keeps column headers", () => {
    const html = render(withChildren(DataTable, { headers: ["Name", ""], isEmpty: true, empty: "No users yet." }, null));
    expect(html).toContain("No users yet.");
    expect(html).toContain('scope="col"');
    expect(html).toContain('<span class="sr-only">Actions</span>');
  });

  it("renders an empty state with its action", () => {
    const html = render(createElement(EmptyState, { title: "Nothing here", text: "Add one", action: createElement("a", { href: "/new" }, "Create") }));
    expect(html).toContain("Nothing here");
    expect(html).toContain('href="/new"');
  });
});

describe("auth pages", () => {
  it("has one h1 and the right copy for users and admins", () => {
    const user = render(withChildren(AuthCard, { title: "Welcome back" }, "form"));
    expect(user.match(/<h1/g)).toHaveLength(1);
    expect(user).toContain("Click on any text to change it");
    const admin = render(withChildren(AuthCard, { title: "Admin sign in", variant: "admin" }, "form"));
    expect(admin).toContain("Run the platform with confidence.");
    expect(admin).not.toContain("Click on any text");
  });
});
