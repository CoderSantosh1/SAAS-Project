import { strFromU8, unzipSync } from "fflate";
import { z } from "zod";
import { getTheme } from "@/themes/registry";
import { getSectionDefinition } from "@/themes/sections";
import { designTokensSchema, type DesignTokens } from "@/themes/types";

// A theme package is untrusted input. Nothing in it is ever executed: it may contain
// only theme.json and images, and its content must pass the same schemas as any site.
export const MAX_PACKAGE_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 200;
const MAX_UNPACKED_BYTES = 100 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 1024 * 1024;
const MAX_ASSET_BYTES = 10 * 1024 * 1024;

const ASSET_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

// Operating systems add these on their own, so they are dropped rather than refused.
function isSystemFile(name: string) {
  return /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$|desktop\.ini$)/.test(name);
}

function hasImageSignature(bytes: Uint8Array, mime: string) {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  switch (mime) {
    case "image/png":
      return bytes[0] === 0x89 && ascii(1, 4) === "PNG";
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/gif":
      return ascii(0, 4) === "GIF8";
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "image/avif":
      return ascii(4, 8) === "ftyp";
    default:
      return false;
  }
}

const manifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  component: z.strictObject({ id: z.string().min(1).max(60), version: z.string().min(1).max(20) }),
  tokens: designTokensSchema,
  pages: z
    .array(
      z.strictObject({
        title: z.string().trim().min(1).max(120),
        slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80),
        isHome: z.boolean().optional(),
        sections: z.array(z.strictObject({ type: z.string(), props: z.unknown() })).max(100),
      }),
    )
    .min(1)
    .max(50),
});

export type PackagePage = {
  title: string;
  slug: string;
  isHome?: boolean;
  sections: { type: string; props: Record<string, unknown> }[];
};

export type ThemePackage = {
  componentId: string;
  componentVersion: string;
  tokens: DesignTokens;
  pages: PackagePage[];
  assets: { name: string; mime: string; bytes: Uint8Array; url: string }[];
};

export type ParseResult = { ok: true; value: ThemePackage } | { ok: false; errors: string[] };

function replaceAssetRefs(value: unknown, urls: Map<string, string>, missing: Set<string>): unknown {
  if (typeof value === "string") {
    if (!value.startsWith("assets/")) return value;
    const url = urls.get(value.slice("assets/".length));
    if (!url) missing.add(value);
    return url ?? value;
  }
  if (Array.isArray(value)) return value.map((item) => replaceAssetRefs(item, urls, missing));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceAssetRefs(item, urls, missing)]),
    );
  }
  return value;
}

// assetUrl gives each asset's final public address, so content can be validated in full
// before anything is stored.
export function parseThemePackage(data: Uint8Array, assetUrl: (name: string) => string): ParseResult {
  if (data.byteLength > MAX_PACKAGE_BYTES) return { ok: false, errors: ["The package is larger than 25 MB."] };

  const errors: string[] = [];
  let declaredTotal = 0;
  let declaredCount = 0;
  let tooLarge = false;

  let files: Record<string, Uint8Array>;
  try {
    // The filter sees each file's declared size before it is unpacked, which is what
    // stops a small archive from expanding into gigabytes.
    files = unzipSync(data, {
      filter: ({ name, originalSize }) => {
        if (name.endsWith("/") || isSystemFile(name)) return false;
        declaredCount += 1;
        declaredTotal += originalSize;
        if (declaredCount > MAX_FILES || declaredTotal > MAX_UNPACKED_BYTES) tooLarge = true;
        return !tooLarge;
      },
    });
  } catch {
    return { ok: false, errors: ["This file is not a valid ZIP archive."] };
  }

  if (tooLarge) {
    return { ok: false, errors: [`The package may hold at most ${MAX_FILES} files and 100 MB when unpacked.`] };
  }

  const assets: { name: string; mime: string; bytes: Uint8Array }[] = [];
  let manifestBytes: Uint8Array | undefined;

  for (const [name, bytes] of Object.entries(files)) {
    if (name === "theme.json") {
      manifestBytes = bytes;
      continue;
    }
    const asset = name.match(/^assets\/([A-Za-z0-9][A-Za-z0-9_-]*)\.([A-Za-z0-9]+)$/);
    const mime = asset ? ASSET_TYPES[asset[2]!.toLowerCase()] : undefined;
    if (!asset || !mime) {
      errors.push(`Unsupported file: ${name}. A package may contain only theme.json and images in assets/.`);
      continue;
    }
    if (bytes.byteLength > MAX_ASSET_BYTES) {
      errors.push(`${name} is larger than 10 MB.`);
    } else if (!hasImageSignature(bytes, mime)) {
      errors.push(`${name} is not a real ${mime.replace("image/", "").toUpperCase()} image.`);
    } else {
      assets.push({ name: `${asset[1]}.${asset[2]!.toLowerCase()}`, mime, bytes });
    }
  }

  if (!manifestBytes) {
    errors.push("theme.json is missing. It must be at the top level of the ZIP, not inside a folder.");
    return { ok: false, errors };
  }
  if (manifestBytes.byteLength > MAX_MANIFEST_BYTES) {
    errors.push("theme.json is larger than 1 MB.");
    return { ok: false, errors };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(strFromU8(manifestBytes));
  } catch {
    errors.push("theme.json is not valid JSON.");
    return { ok: false, errors };
  }

  const manifest = manifestSchema.safeParse(raw);
  if (!manifest.success) {
    for (const issue of manifest.error.issues.slice(0, 10)) {
      errors.push(`theme.json ${issue.path.join(".") || "root"}: ${issue.message}`);
    }
    return { ok: false, errors };
  }
  const { component, tokens, pages } = manifest.data;

  const theme = getTheme(component.id, component.version);
  if (!theme) {
    errors.push(`"${component.id}" version ${component.version} is not an approved theme component.`);
  }
  if (pages.filter((page) => page.isHome).length !== 1) {
    errors.push("theme.json must mark exactly one page as the homepage.");
  }
  if (new Set(pages.map((page) => page.slug)).size !== pages.length) {
    errors.push("Each page in theme.json needs a different slug.");
  }

  const urls = new Map(assets.map((asset) => [asset.name, assetUrl(asset.name)]));
  const missing = new Set<string>();
  const finalPages: PackagePage[] = [];

  for (const page of pages) {
    const sections: PackagePage["sections"] = [];
    page.sections.forEach((section, index) => {
      const where = `Page "${page.slug}", section ${index + 1}`;
      // A component's own section types are allowed only with that component.
      const definition = getSectionDefinition(theme, section.type);
      if (!definition) {
        errors.push(`${where}: "${section.type}" is not a known section type for this component.`);
        return;
      }
      const parsed = definition.schema.safeParse(replaceAssetRefs(section.props, urls, missing));
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        errors.push(`${where} (${section.type}): ${issue?.path.join(".") || "content"} is not valid. ${issue?.message ?? ""}`.trim());
        return;
      }
      sections.push({ type: section.type, props: parsed.data as Record<string, unknown> });
    });
    finalPages.push({ title: page.title, slug: page.slug, isHome: page.isHome === true, sections });
  }

  for (const ref of missing) errors.push(`theme.json refers to ${ref}, which is not in the package.`);

  if (errors.length > 0) return { ok: false, errors: errors.slice(0, 25) };

  return {
    ok: true,
    value: {
      componentId: component.id,
      componentVersion: component.version,
      tokens,
      pages: finalPages,
      assets: assets.map((asset) => ({ ...asset, url: urls.get(asset.name)! })),
    },
  };
}
