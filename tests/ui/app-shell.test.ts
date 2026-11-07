import { Globe } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { withChildren } from "./render";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

const { activeNavItem, AppShell, breadcrumbs } = await import("@/components/shared/app-shell");
const { adminNavFor, ADMIN_NAV, AdminShell } = await import("@/components/admin/admin-sidebar");
const { USER_NAV, UserShell } = await import("@/components/user/user-sidebar");

const allHrefs = (groups: { items: { href: string }[] }[]) => groups.flatMap((group) => group.items.map((item) => item.href));

describe("active navigation item", () => {
  it("matches exactly, then by the longest prefix, and never a soon item", () => {
    expect(activeNavItem(USER_NAV, "/dashboard")?.label).toBe("Overview");
    expect(activeNavItem(USER_NAV, "/dashboard/websites")?.label).toBe("My Websites");
    expect(activeNavItem(USER_NAV, "/dashboard/websites/123/settings")?.label).toBe("My Websites");
    expect(activeNavItem(USER_NAV, "/dashboard/domains")?.label).toBe("Domains");
    const withSoon = [{ items: [{ label: "Home", href: "/x", icon: Globe }, { label: "Later", href: "/x/later", icon: Globe, soon: true }] }];
    expect(activeNavItem(withSoon, "/x/later")?.label).toBe("Home");
    expect(activeNavItem(USER_NAV, "/dashboard-other")).toBeNull();
  });
});

describe("breadcrumbs", () => {
  it("shows area, section and details", () => {
    expect(breadcrumbs(USER_NAV, "/dashboard", "Dashboard")).toEqual([{ label: "Dashboard", href: "/dashboard" }, { label: "Overview" }]);
    expect(breadcrumbs(USER_NAV, "/dashboard/media", "Dashboard")).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Media Library", href: "/dashboard/media" },
    ]);
    expect(breadcrumbs(USER_NAV, "/dashboard/websites/abc/settings", "Dashboard").map((crumb) => crumb.label)).toEqual(["Dashboard", "My Websites", "Details"]);
  });
});

describe("admin navigation", () => {
  it("shows a super admin every section, each once", () => {
    const groups = adminNavFor({ isSuper: true, roles: [], permissions: [] });
    const hrefs = allHrefs(groups);
    expect(hrefs).toEqual(allHrefs(ADMIN_NAV));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("shows a limited admin only what their permissions allow, and drops empty groups", () => {
    const groups = adminNavFor({ isSuper: false, roles: ["support_admin"], permissions: ["support.manage", "users.view"] });
    expect(allHrefs(groups).sort()).toEqual(["/admin", "/admin/support", "/admin/users"]);
    expect(groups.map((group) => group.label)).toEqual([undefined, "People"]);
  });

  it("links to pages that exist", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    for (const href of allHrefs(ADMIN_NAV)) {
      const dir = join(process.cwd(), "src", "app", "admin", "(panel)", ...href.split("/").slice(2));
      expect(existsSync(join(dir, "page.tsx")), href).toBe(true);
    }
    for (const item of USER_NAV.flatMap((group) => group.items)) {
      expect(existsSync(join(process.cwd(), "src", "app", ...item.href.split("/").slice(1), "page.tsx")), item.href).toBe(true);
    }
  });
});

describe("app shell", () => {
  beforeEach(() => {
    navigation.pathname = "/dashboard/websites";
  });

  it("renders navigation, the current page, breadcrumbs and the main area", () => {
    const html = renderToStaticMarkup(withChildren(UserShell, { brandName: "WEB", footer: "Footer here" }, createElement("p", null, "Page body")));
    expect(html).toContain('aria-label="Dashboard"');
    expect(html).toMatch(/aria-current="page"[^>]*href="\/dashboard\/websites"|href="\/dashboard\/websites"[^>]*aria-current="page"/);
    expect(html.match(/aria-current="page"/g)?.length).toBe(2); // the sidebar link and the breadcrumb
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('<main id="main"');
    expect(html).toContain("Page body");
    expect(html).toContain("Footer here");
    expect(html).toContain('aria-label="Open menu"');
    expect(html).toContain("New website");
  });

  it("has no coming-soon items left in the user menu", () => {
    expect(USER_NAV.flatMap((group) => group.items).filter((item) => item.soon)).toEqual([]);
    const html = renderToStaticMarkup(withChildren(UserShell, { brandName: "WEB", footer: null }, null));
    for (const href of ["/dashboard/domains", "/dashboard/analytics", "/dashboard/billing"]) expect(html).toContain(`href="${href}"`);
    expect(html).not.toContain(">Soon<");
  });

  it("still shows a coming-soon item as disabled, not as a link", () => {
    const groups = [{ items: [{ label: "Home", href: "/x", icon: Globe }, { label: "Later", href: "/x/later", icon: Globe, soon: true }] }];
    const html = renderToStaticMarkup(withChildren(AppShell, { tone: "light" as const, label: "Area", brand: "Brand", groups, footer: null }, null));
    expect(html).not.toContain('href="/x/later"');
    expect(html).toContain('aria-disabled="true"');
  });

  it("renders the admin shell with its dark sidebar, filtered by permission", () => {
    navigation.pathname = "/admin/themes";
    const html = renderToStaticMarkup(
      withChildren(AdminShell, { access: { isSuper: false, roles: [], permissions: ["themes.manage"] }, brandName: "WEB", footer: null }, null),
    );
    expect(html).toContain("via-navy/95");
    expect(html).toContain('href="/admin/themes"');
    expect(html).not.toContain('href="/admin/users"');
    expect(html).toContain("Themes");
  });

  it("works with any group layout", () => {
    navigation.pathname = "/x/b";
    const groups = [{ items: [{ label: "A", href: "/x", icon: Globe }] }, { label: "More", items: [{ label: "B", href: "/x/b", icon: Globe }] }];
    const html = renderToStaticMarkup(withChildren(AppShell, { tone: "light" as const, label: "Area", brand: "Brand", groups, footer: null }, null));
    expect(html).toContain("More");
    expect(html).toContain("Brand");
  });
});
