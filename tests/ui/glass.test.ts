import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { withChildren } from "./render";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

const { AuthCard } = await import("@/components/shared/auth-card");
const { UserShell } = await import("@/components/user/user-sidebar");
const { AdminShell } = await import("@/components/admin/admin-sidebar");

const read = (...path: string[]) => readFileSync(join(process.cwd(), ...path), "utf8");
const css = read("src", "app", "globals.css");

describe("glass and gradient look", () => {
  it("applies to the user dashboard and sign-in screens", () => {
    expect(renderToStaticMarkup(withChildren(UserShell, { brandName: "WEB", footer: null }, null))).toContain("ui-glass");
    expect(renderToStaticMarkup(withChildren(AuthCard, { title: "Sign in" }, null))).toContain("ui-glass");
  });

  it("applies to every public page, including maintenance mode", () => {
    expect(read("src", "app", "(public)", "layout.tsx").match(/className="ui-glass /g)).toHaveLength(2);
  });

  it("applies to the admin panel too, with its dark sidebar kept readable", () => {
    const admin = renderToStaticMarkup(withChildren(AdminShell, { access: { isSuper: true, roles: [], permissions: [] }, brandName: "WEB", footer: null }, null));
    expect(admin).toContain("ui-glass");
    // The sidebar stays a dark panel with white text, not translucent glass.
    expect(admin).toMatch(/<aside class="[^"]*via-navy\/95[^"]*text-white/);
  });

  it("never reaches the websites people build", () => {
    // Websites use only their own tokens, so the glass rules must not reach .site-root.
    expect(css).not.toMatch(/\.ui-glass[^{]*\.site-root/);
    expect(read("src", "themes", "renderer.tsx")).not.toContain("ui-glass");
  });

  it("restyles through the platform tokens, so every card and button follows", () => {
    const block = css.slice(css.indexOf(".ui-glass {"), css.indexOf("}", css.indexOf(".ui-glass {")));
    for (const token of ["--surface", "--border", "--background", "--card-shadow", "--elevated-shadow"]) {
      expect(block, token).toContain(`${token}:`);
    }
    // Card and elevated shadows must read the variables, or the scope cannot change them.
    expect(css).toContain("--shadow-card: var(--card-shadow)");
    expect(css).toContain("--shadow-elevated: var(--elevated-shadow)");
  });

  it("falls back to solid surfaces for people who ask for less transparency", () => {
    const fallback = css.slice(css.indexOf("prefers-reduced-transparency"));
    expect(fallback).toContain("--surface: #ffffff");
    expect(fallback).toContain("backdrop-filter: none");
  });
});
