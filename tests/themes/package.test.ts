import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { MAX_PACKAGE_BYTES, parseThemePackage } from "@/features/themes/package";
import { getThemeDefinitionBySlug } from "@/themes/registry";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const definition = getThemeDefinitionBySlug("meridian")!;

const manifest = (changes: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  component: { id: "meridian", version: "1.0.0" },
  tokens: definition.tokens,
  pages: [
    {
      title: "Home",
      slug: "home",
      isHome: true,
      sections: [{ type: "hero", props: { heading: "Hello", image: { src: "assets/hero.png", alt: "Hero" } } }],
    },
  ],
  ...changes,
});

function build(files: Record<string, Uint8Array | string | object>) {
  const entries: Record<string, Uint8Array> = {};
  for (const [name, value] of Object.entries(files)) {
    entries[name] =
      value instanceof Uint8Array ? value : strToU8(typeof value === "string" ? value : JSON.stringify(value));
  }
  return zipSync(entries);
}

const parse = (data: Uint8Array) => parseThemePackage(data, (name) => `https://cdn.example/themes/x/${name}`);

function errorsOf(data: Uint8Array) {
  const result = parse(data);
  if (result.ok) throw new Error("expected the package to be rejected");
  return result.errors.join("\n");
}

describe("parseThemePackage", () => {
  it("accepts a valid package and rewrites asset references to public URLs", () => {
    const result = parse(build({ "theme.json": manifest(), "assets/hero.png": PNG }));
    if (!result.ok) throw new Error(result.errors.join());
    expect(result.value.componentId).toBe("meridian");
    expect(result.value.assets.map((asset) => asset.name)).toEqual(["hero.png"]);
    expect(result.value.pages[0]!.sections[0]!.props).toMatchObject({
      image: { src: "https://cdn.example/themes/x/hero.png" },
    });
  });

  it("ignores files that operating systems add on their own", () => {
    const result = parse(
      build({
        "theme.json": manifest(),
        "assets/hero.png": PNG,
        "__MACOSX/assets/._hero.png": "x",
        ".DS_Store": "x",
        "assets/Thumbs.db": "x",
      }),
    );
    expect(result.ok).toBe(true);
  });

  it.each([
    ["JavaScript", "index.js", "alert(1)"],
    ["a React component", "components/Hero.tsx", "export default 1"],
    ["HTML", "index.html", "<script>alert(1)</script>"],
    ["an executable", "setup.exe", "MZ"],
    ["SVG, which can hold scripts", "assets/logo.svg", "<svg onload='alert(1)'/>"],
    ["a script disguised in assets", "assets/run.js", "alert(1)"],
    ["a double extension", "assets/hero.png.js", "alert(1)"],
    ["a path traversal", "../../evil.png", PNG],
    ["a nested asset", "assets/a/b.png", PNG],
    ["a hidden file", "assets/.hero.png", PNG],
    ["a package config", "package.json", "{}"],
  ])("refuses %s", (_name, path, content) => {
    expect(errorsOf(build({ "theme.json": manifest(), "assets/hero.png": PNG, [path]: content }))).toContain("Unsupported file");
  });

  it("refuses a file that is not really the image it claims to be", () => {
    expect(errorsOf(build({ "theme.json": manifest(), "assets/hero.png": "<script>alert(1)</script>" }))).toContain(
      "not a real PNG",
    );
  });

  it("refuses anything that is not a ZIP", () => {
    expect(errorsOf(strToU8("definitely not a zip"))).toContain("not a valid ZIP");
  });

  it("refuses an oversized upload before unpacking it", () => {
    expect(errorsOf(new Uint8Array(MAX_PACKAGE_BYTES + 1))).toContain("larger than 25 MB");
  });

  it("refuses a zip bomb without unpacking it to the end", () => {
    const big = new Uint8Array(30 * 1024 * 1024);
    const files: Record<string, Uint8Array> = {};
    for (let index = 0; index < 4; index += 1) files[`assets/a${index}.png`] = big;
    const data = zipSync(files, { level: 9 });
    expect(data.byteLength).toBeLessThan(1024 * 1024);
    expect(errorsOf(data)).toContain("100 MB");
  });

  it("refuses too many files", () => {
    const files: Record<string, Uint8Array> = {};
    for (let index = 0; index < 201; index += 1) files[`assets/a${index}.png`] = PNG;
    expect(errorsOf(zipSync(files))).toContain("200 files");
  });

  it("requires theme.json at the top level", () => {
    expect(errorsOf(build({ "my-theme/theme.json": manifest() }))).toContain("theme.json is missing");
    expect(errorsOf(build({ "assets/hero.png": PNG }))).toContain("theme.json is missing");
  });

  it("refuses malformed theme.json and unknown fields", () => {
    expect(errorsOf(build({ "theme.json": "{not json" }))).toContain("not valid JSON");
    expect(errorsOf(build({ "theme.json": manifest({ script: "run.js" }), "assets/hero.png": PNG }))).toContain("theme.json");
    expect(errorsOf(build({ "theme.json": manifest({ schemaVersion: 2 }), "assets/hero.png": PNG }))).toContain("schemaVersion");
  });

  it("refuses a component that is not approved", () => {
    for (const component of [{ id: "uploaded-code", version: "1.0.0" }, { id: "meridian", version: "9.9.9" }]) {
      expect(errorsOf(build({ "theme.json": manifest({ component }), "assets/hero.png": PNG }))).toContain("not an approved");
    }
  });

  it("refuses unsafe design tokens", () => {
    const tokens = { ...definition.tokens, primary: "red;background:url(//evil.example)" };
    expect(errorsOf(build({ "theme.json": manifest({ tokens }), "assets/hero.png": PNG }))).toContain("tokens.primary");
    const font = { ...definition.tokens, headingFont: "evil-font" };
    expect(errorsOf(build({ "theme.json": manifest({ tokens: font }), "assets/hero.png": PNG }))).toContain("headingFont");
  });

  const withSection = (type: string, props: unknown) =>
    manifest({ pages: [{ title: "Home", slug: "home", isHome: true, sections: [{ type, props }] }] });

  it("refuses unknown section types, including prototype keys", () => {
    for (const type of ["custom-code", "constructor", "__proto__"]) {
      expect(errorsOf(build({ "theme.json": withSection(type, {}) }))).toContain("not a known section type");
    }
  });

  it("refuses unsafe links and images in content", () => {
    const unsafe = [
      { heading: "x", primaryButton: { label: "Go", href: "javascript:alert(1)" } },
      { heading: "x", image: { src: "javascript:alert(1)", alt: "" } },
      { heading: "x", image: { src: "data:text/html,x", alt: "" } },
      { heading: "x", image: { src: "//evil.example/x.png", alt: "" } },
    ];
    for (const props of unsafe) {
      expect(errorsOf(build({ "theme.json": withSection("hero", props) }))).toContain("is not valid");
    }
  });

  it("refuses a reference to an asset that is not in the package", () => {
    expect(errorsOf(build({ "theme.json": manifest() }))).toContain("assets/hero.png, which is not in the package");
  });

  it("requires exactly one homepage and unique slugs", () => {
    const page = { title: "A", slug: "a", sections: [] };
    expect(errorsOf(build({ "theme.json": manifest({ pages: [page] }) }))).toContain("exactly one page");
    expect(
      errorsOf(build({ "theme.json": manifest({ pages: [{ ...page, isHome: true }, page] }) })),
    ).toContain("different slug");
  });

  it("accepts every registered theme's own content as a package", () => {
    const theme = getThemeDefinitionBySlug("hearth")!;
    const result = parse(
      build({
        "theme.json": {
          schemaVersion: 1,
          component: { id: theme.componentId, version: theme.version },
          tokens: theme.tokens,
          pages: theme.pages,
        },
      }),
    );
    if (!result.ok) throw new Error(result.errors.join("\n"));
    expect(result.value.pages).toHaveLength(theme.pages.length);
  });
});
