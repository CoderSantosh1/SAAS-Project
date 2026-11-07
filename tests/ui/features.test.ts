import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pageLabel, trendLabel } from "@/features/analytics/summary";
import { formatBytes, formatRupees, limitLabel, usagePercent } from "@/features/billing/format";
import { cnameTarget, customDomainPath, dnsRecords, hostnameSchema, isPlatformRequest, normalizeHostname } from "@/features/domains/hostnames";
import { liveSitePath } from "@/features/websites/urls";
import { classifyRoute } from "@/lib/auth/routes";

// The dashboard features that used to say "coming soon": publishing, domains,
// analytics and billing.

describe("live site addresses", () => {
  it("builds the public path of a website and its pages", () => {
    expect(liveSitePath("alice-bakery")).toBe("/sites/alice-bakery");
    expect(liveSitePath("alice-bakery", "menu")).toBe("/sites/alice-bakery/menu");
  });

  it("lets anyone visit a live site without signing in", () => {
    expect(classifyRoute(liveSitePath("alice-bakery"))).toBe("public");
    expect(classifyRoute(liveSitePath("alice-bakery", "menu"))).toBe("public");
  });
});

describe("custom domains", () => {
  it("cleans up what people paste", () => {
    expect(normalizeHostname("  https://WWW.Example.in/about?x=1 ")).toBe("www.example.in");
    expect(normalizeHostname("shop.example.com:443")).toBe("shop.example.com");
    expect(normalizeHostname("example.co.in.")).toBe("example.co.in");
  });

  it("accepts real domains and refuses everything else", () => {
    for (const ok of ["www.alicebakes.in", "Alicebakes.IN", "https://shop.example.co.uk/"]) expect(hostnameSchema.safeParse(ok).success, ok).toBe(true);
    for (const bad of ["", "localhost", "no spaces.com", "-bad.example.com", "example", "a".repeat(250) + ".com", "javascript:alert(1)"]) {
      expect(hostnameSchema.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("shows the two DNS records the admin check expects", () => {
    const records = dnsRecords("www.alicebakes.in", "abc123", "sites.example.com");
    expect(records).toEqual([
      expect.objectContaining({ type: "CNAME", name: "www.alicebakes.in", value: "sites.example.com" }),
      expect.objectContaining({ type: "TXT", name: "_web-verify.www.alicebakes.in", value: "abc123" }),
    ]);
    // verifyDomain resolves TXT at _web-verify.<host> and compares it with the raw token.
    const admin = readFileSync(join(process.cwd(), "src", "features", "admin", "panel-actions.ts"), "utf8");
    expect(admin).toContain("resolveTxt(`_web-verify.${hostname}`)");
    expect(admin).toContain('parts.join("") === token');
  });

  it("derives the CNAME target from the site URL unless one is set", () => {
    expect(cnameTarget("https://webbuilder.in", "")).toBe("sites.webbuilder.in");
    expect(cnameTarget("https://webbuilder.in", "edge.example.net")).toBe("edge.example.net");
  });

  it("only re-routes requests that arrive on a customer's domain", () => {
    for (const host of [null, "localhost:3000", "127.0.0.1:3000", "webbuilder.in", "www.webbuilder.in", "preview-123.vercel.app"]) {
      expect(isPlatformRequest(host, "https://webbuilder.in"), String(host)).toBe(true);
    }
    expect(isPlatformRequest("www.alicebakes.in", "https://webbuilder.in")).toBe(false);
  });

  it("maps custom domain paths onto the live site without doubling the prefix", () => {
    expect(customDomainPath("alice", "/")).toBe("/sites/alice");
    expect(customDomainPath("alice", "/menu")).toBe("/sites/alice/menu");
    expect(customDomainPath("alice", "/sites/alice/menu")).toBe("/sites/alice/menu");
    expect(customDomainPath("alice", "/sites/alicex")).toBe("/sites/alice/sites/alicex");
  });
});

describe("analytics summary", () => {
  it("describes the change from the previous period in plain words", () => {
    expect(trendLabel(0, 0)).toEqual({ label: "No visits yet", direction: "flat" });
    expect(trendLabel(12, 0).direction).toBe("new");
    expect(trendLabel(150, 100)).toEqual({ label: "50% more than the previous period", direction: "up" });
    expect(trendLabel(75, 100)).toEqual({ label: "25% fewer than the previous period", direction: "down" });
    expect(trendLabel(100, 100).direction).toBe("flat");
  });

  it("names pages for people", () => {
    expect(pageLabel("")).toBe("Home");
    expect(pageLabel("practice-areas")).toBe("Practice areas");
  });
});

describe("billing format", () => {
  it("shows prices in rupees", () => {
    expect(formatRupees(0)).toBe("Free");
    expect(formatRupees(9900)).toBe("₹99");
    expect(formatRupees(79950)).toBe("₹799.5");
    expect(formatRupees(12345600)).toBe("₹1,23,456");
  });

  it("shows sizes, limits and how full they are", () => {
    expect(formatBytes(512)).toBe("1 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(usagePercent(3, 10)).toBe(30);
    expect(usagePercent(30, 10)).toBe(100);
    expect(usagePercent(3, null)).toBeNull();
    expect(limitLabel(null, "websites")).toBe("Unlimited websites");
    expect(limitLabel(1000, "websites")).toBe("1,000 websites");
  });
});

describe("no coming-soon features left", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? files(path) : /\.(tsx?)$/.test(name) ? [path] : [];
    });

  it("has no 'coming soon' text or disabled publish buttons in the app", () => {
    const offenders = [...files(join(process.cwd(), "src", "app")), ...files(join(process.cwd(), "src", "components")), ...files(join(process.cwd(), "src", "features"))].filter((path) =>
      /coming soon|will be available here soon/i.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("has a page for every dashboard feature", () => {
    for (const page of ["domains", "analytics", "billing"]) {
      expect(statSync(join(process.cwd(), "src", "app", "dashboard", page, "page.tsx")).isFile(), page).toBe(true);
    }
    expect(statSync(join(process.cwd(), "src", "app", "sites", "[slug]", "[[...page]]", "page.tsx")).isFile()).toBe(true);
  });
});
