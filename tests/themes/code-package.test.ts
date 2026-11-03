import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";
import { listThemeDefinitions } from "@/themes/registry";

vi.mock("server-only", () => ({}));

const { buildThemeCodePackage } = await import("@/features/themes/code-package");

describe("theme code package", () => {
  for (const definition of listThemeDefinitions()) {
    it(`packages ${definition.slug} as a runnable project`, () => {
      const built = buildThemeCodePackage({
        name: definition.name,
        slug: definition.slug,
        version: definition.version,
        component_id: definition.componentId,
        component_version: definition.version,
        design_tokens: definition.tokens,
        default_config: { pages: definition.pages.map((page) => ({ ...page, isHome: page.isHome ?? false })) },
      });
      expect(built).not.toBeNull();
      const files = unzipSync(built!.bytes);
      const base = `${definition.slug}-theme`;
      for (const path of ["package.json", "app/[[...page]]/page.tsx", "app/globals.css", "src/themes/registry.ts", "src/themes/renderer.tsx", "src/themes/types.ts", "content/site.json", "README.md"]) {
        expect(files, path).toHaveProperty([`${base}/${path}`]);
      }
      expect(Object.keys(files).some((path) => path.startsWith(`${base}/src/themes/implementations/${definition.componentId}/`))).toBe(true);
      // Only this theme's source, not the others.
      expect(Object.keys(files).filter((path) => path.includes("/implementations/")).every((path) => path.includes(`/implementations/${definition.componentId}/`))).toBe(true);

      const site = JSON.parse(strFromU8(files[`${base}/content/site.json`]!)) as { themeId: string; pages: unknown[] };
      expect(site.themeId).toBe(definition.componentId);
      expect(site.pages).toHaveLength(definition.pages.length);
    });
  }

  it("refuses a component that is not registered", () => {
    expect(
      buildThemeCodePackage({ name: "X", slug: "x", version: "1.0.0", component_id: "../../etc", component_version: "1.0.0", design_tokens: {}, default_config: { pages: [] } }),
    ).toBeNull();
  });
});
