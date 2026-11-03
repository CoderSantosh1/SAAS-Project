import "server-only";

import { strToU8, zipSync, type Zippable } from "fflate";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { getTheme } from "@/themes/registry";
import { getThemePreviewDocument } from "./preview";

// Builds a theme's downloadable source package: the theme's own folder, the small
// runtime it needs, its images, the active version's content, and a minimal Next.js
// app that renders it. Files are only read and zipped, never run.

export type CodeDownload = {
  name: string;
  slug: string;
  version: string;
  component_id: string;
  component_version: string;
  design_tokens: unknown;
  default_config: { pages?: unknown } | null;
};

const ROOT = process.cwd();
const RUNTIME_FILES = ["src/themes/types.ts", "src/themes/renderer.tsx", "src/themes/sections.ts", "src/themes/section-rows.ts"];
const SAFE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function addTree(files: Zippable, from: string, to: string) {
  if (!existsSync(from)) return;
  for (const entry of readdirSync(from)) {
    const source = join(from, entry);
    const target = `${to}/${entry}`;
    if (statSync(source).isDirectory()) addTree(files, source, target);
    else files[target] = readFileSync(source);
  }
}

function text(files: Zippable, path: string, content: string) {
  files[path] = strToU8(content);
}

function camel(id: string) {
  return id.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

export function buildThemeCodePackage(download: CodeDownload) {
  const id = download.component_id;
  if (!SAFE_ID.test(id) || !getTheme(id, download.component_version)) return null;
  const themeDir = join(ROOT, "src", "themes", "implementations", id);
  if (!existsSync(themeDir)) return null;

  const loaded = getThemePreviewDocument({
    component_id: id,
    version: download.component_version,
    name: download.name,
    design_tokens: download.design_tokens,
    pages: download.default_config?.pages,
  });
  if (!loaded) return null;

  const base = `${download.slug}-theme`;
  const files: Zippable = {};

  for (const file of RUNTIME_FILES) {
    const source = join(ROOT, file);
    if (existsSync(source)) files[`${base}/${file}`] = readFileSync(source);
  }
  addTree(files, join(ROOT, "src", "themes", "shared"), `${base}/src/themes/shared`);
  addTree(files, themeDir, `${base}/src/themes/implementations/${id}`);
  addTree(files, join(ROOT, "public", "themes", id), `${base}/public/themes/${id}`);
  if (download.slug !== id && SAFE_ID.test(download.slug)) {
    addTree(files, join(ROOT, "public", "themes", download.slug), `${base}/public/themes/${download.slug}`);
  }

  const name = camel(id);
  text(
    files,
    `${base}/src/themes/registry.ts`,
    `import { ${name}Components } from "./implementations/${id}/components";
import { ${name}Definition } from "./implementations/${id}/definition";
import type { RegisteredTheme, ThemeDefinition } from "./types";

// This package registers one theme. The platform's registry lists every theme.
const REGISTERED_THEMES: RegisteredTheme[] = [{ definition: ${name}Definition, components: ${name}Components }];

export function getTheme(componentId: string, version: string) {
  return REGISTERED_THEMES.find(({ definition }) => definition.componentId === componentId && definition.version === version) ?? null;
}

export function listThemeDefinitions(): ThemeDefinition[] {
  return REGISTERED_THEMES.map(({ definition }) => definition);
}
`,
  );
  const hasStyles = existsSync(join(themeDir, "styles.css"));
  text(files, `${base}/src/themes/styles.css`, hasStyles ? `@import "./implementations/${id}/styles.css";\n` : "/* This theme has no stylesheet of its own. */\n");

  const globals = readFileSync(join(ROOT, "src", "app", "globals.css"), "utf8").replace('@import "../themes/styles.css";', '@import "../src/themes/styles.css";');
  text(files, `${base}/app/globals.css`, globals);
  text(files, `${base}/content/site.json`, `${JSON.stringify(loaded.document, null, 2)}\n`);

  text(
    files,
    `${base}/app/layout.tsx`,
    `import type { Metadata } from "next";
import type { ReactNode } from "react";
import site from "../content/site.json";
import "./globals.css";

export const metadata: Metadata = { title: site.siteName };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
`,
  );
  text(
    files,
    `${base}/app/[[...page]]/page.tsx`,
    `import { notFound } from "next/navigation";
import site from "../../content/site.json";
import { findPage, parseSiteDocument, SiteRenderer } from "@/themes/renderer";
import { siteFontClassName } from "@/themes/shared/fonts";

// Edit content/site.json to change the text, images and pages.
const document = parseSiteDocument(site);

export function generateStaticParams() {
  return (document?.pages ?? []).map((page) => ({ page: page.isHome ? [] : [page.slug] }));
}

export default async function Page({ params }: { params: Promise<{ page?: string[] }> }) {
  const { page: path } = await params;
  if (!document || (path && path.length > 1)) notFound();
  const page = findPage(document, path?.[0]);
  if (!page) notFound();
  return <SiteRenderer document={document} page={page} className={siteFontClassName} />;
}
`,
  );

  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };
  const pick = (from: Record<string, string>, keys: string[]) => Object.fromEntries(keys.filter((key) => from[key]).map((key) => [key, from[key]!]));
  text(
    files,
    `${base}/package.json`,
    `${JSON.stringify(
      {
        name: `${download.slug}-theme`,
        version: download.version,
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: pick(pkg.dependencies, ["next", "react", "react-dom", "lucide-react", "zod"]),
        devDependencies: pick(pkg.devDependencies, ["@tailwindcss/postcss", "tailwindcss", "typescript", "@types/node", "@types/react", "@types/react-dom"]),
      },
      null,
      2,
    )}\n`,
  );
  text(files, `${base}/postcss.config.mjs`, `export default { plugins: { "@tailwindcss/postcss": {} } };\n`);
  text(files, `${base}/next.config.ts`, `import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {};\n\nexport default nextConfig;\n`);
  text(
    files,
    `${base}/tsconfig.json`,
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["dom", "dom.iterable", "esnext"],
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "react-jsx",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./src/*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2,
    )}\n`,
  );
  text(files, `${base}/.gitignore`, "node_modules\n.next\nnext-env.d.ts\n");
  text(
    files,
    `${base}/README.md`,
    `# ${download.name} theme (version ${download.version})

The source code of the ${download.name} theme, with a small Next.js app that renders it.

## Run it

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Then open http://localhost:3000.

## What is inside

- \`src/themes/implementations/${id}/\`: the theme itself. \`definition.ts\` holds its colors, fonts and starter pages, \`components.ts\` maps each section type to a component, and \`custom-sections.tsx\` holds the sections only this theme offers.
- \`src/themes/\`: the small runtime that renders a site document with a theme.
- \`content/site.json\`: the pages, text and images. Change them here.
- \`public/themes/\`: the theme's images.

## Bringing changes back to the platform

Copy \`src/themes/implementations/${id}/\` into the platform's theme kit, bump \`version\` in \`definition.ts\`, run \`pnpm theme:check\`, and send it for review. See docs/theme-development.md in the platform repository.
`,
  );

  return { filename: `${download.slug}-theme-${download.version}.zip`, bytes: zipSync(files, { level: 6 }) };
}
