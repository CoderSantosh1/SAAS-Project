// Scaffolds a new code theme and registers it.
//
//   pnpm theme:new <slug> [--name "Display Name"]
//
// Creates src/themes/implementations/<slug>/ with a definition, components, one example
// custom section and a scoped stylesheet, then adds it to the registry and theme styles.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [slug, ...rest] = process.argv.slice(2);
const nameIndex = rest.indexOf("--name");

if (!slug || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: pnpm theme:new <slug> [--name "Display Name"]   (slug: lowercase letters, numbers and hyphens)');
  process.exit(1);
}

const root = process.cwd();
const dir = join(root, "src", "themes", "implementations", slug);
if (existsSync(dir)) {
  console.error(`${dir} already exists.`);
  process.exit(1);
}

const camel = slug.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
const name =
  (nameIndex !== -1 ? rest[nameIndex + 1] : undefined) ??
  slug.split("-").map((part) => part[0]!.toUpperCase() + part.slice(1)).join(" ");

const definition = `import type { ThemeDefinition } from "../../types";

// Plain data: no React here. The sample content is what a new website starts with.
export const ${camel}Definition: ThemeDefinition = {
  componentId: "${slug}",
  version: "1.0.0",
  name: ${JSON.stringify(name)},
  slug: "${slug}",
  description: "Describe this theme in one sentence.",
  authorName: "Your name",
  // Category slugs from the admin panel. The first is the theme's main category.
  primaryCategory: "business",
  categories: ["business"],
  isFeatured: false,
  supportedFeatures: ["multi-page", "responsive"],
  compatibility: { minDocumentVersion: 1 },
  // Owners can change primary, fonts and corners in the editor. Tests check contrast.
  tokens: {
    primary: "#1D4ED8",
    onPrimary: "#FFFFFF",
    background: "#FFFFFF",
    surface: "#F1F5F9",
    text: "#0F172A",
    mutedText: "#475569",
    border: "#E2E8F0",
    headingFont: "sora",
    bodyFont: "inter",
    radius: "lg",
  },
  pages: [
    {
      title: "Home",
      slug: "home",
      isHome: true,
      sections: [
        {
          type: "hero",
          props: {
            heading: "Your headline goes here",
            subheading: "A short line about what you do.",
            primaryButton: { label: "Contact us", href: "/contact" },
          },
        },
        { type: "highlight", props: { title: "A custom section", text: "This section type only exists in this theme." } },
      ],
    },
    {
      title: "Contact",
      slug: "contact",
      sections: [{ type: "contact", props: { heading: "Get in touch", email: "hello@example.com" } }],
    },
  ],
};
`;

const customSections = `import { z } from "zod";
import { defineSection, fieldSchemas as f } from "../../types";

// A section type only this theme offers: a schema (what content is allowed), editor
// fields, starter content and a component. Use the fieldSchemas helpers for any text,
// link or image, so content gets the platform's safety checks.
export const highlight = defineSection({
  label: "Highlight",
  schema: z.object({ title: f.shortText, text: f.longText.optional() }),
  fields: [
    { kind: "text", key: "title", label: "Title" },
    { kind: "textarea", key: "text", label: "Text" },
  ],
  defaults: { title: "A custom section" },
  component: ({ props }) => (
    <section className="py-20">
      <div className="${slug}-shell text-center">
        <h2 className="text-4xl font-semibold">{props.title}</h2>
        {props.text && <p className="mt-4 text-lg text-[var(--site-muted)]">{props.text}</p>}
      </div>
    </section>
  ),
});

export const ${camel}CustomSections = { highlight };
`;

const components = `import {
  About,
  Contact,
  Cta,
  FeaturesCards,
  FooterSimple,
  GalleryGrid,
  HeaderBar,
  HeroSplit,
  ServicesCards,
  Stats,
  TestimonialsCards,
} from "../../shared/sections";
import type { ThemeComponents } from "../../types";
import { ${camel}CustomSections } from "./custom-sections";

// Start from the shared building blocks, then replace any of them with your own React
// components. Colors and fonts come from CSS variables such as var(--site-primary).
export const ${camel}Components: ThemeComponents = {
  Header: HeaderBar,
  Footer: FooterSimple,
  sections: {
    hero: HeroSplit,
    features: FeaturesCards,
    about: About,
    services: ServicesCards,
    gallery: GalleryGrid,
    testimonials: TestimonialsCards,
    stats: Stats,
    cta: Cta,
    contact: Contact,
  },
  customSections: ${camel}CustomSections,
};
`;

const styles = `/* ${name} theme styles. Scope every rule to this theme's root. */
[data-theme="${slug}"] .${slug}-shell {
  margin-inline: auto;
  width: 100%;
  max-width: 72rem;
  padding-inline: clamp(16px, 4vw, 48px);
}
`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "definition.ts"), definition);
writeFileSync(join(dir, "custom-sections.tsx"), customSections);
writeFileSync(join(dir, "components.ts"), components);
writeFileSync(join(dir, "styles.css"), styles);

const registryPath = join(root, "src", "themes", "registry.ts");
let registry = readFileSync(registryPath, "utf8");
const importMarker = "// theme:imports";
const entryMarker = "  // theme:entries";
if (!registry.includes(importMarker) || !registry.includes(entryMarker)) {
  console.error("Could not find the theme markers in src/themes/registry.ts. Register the theme there by hand.");
  process.exit(1);
}
registry = registry
  .replace(
    importMarker,
    `import { ${camel}Components } from "./implementations/${slug}/components";\nimport { ${camel}Definition } from "./implementations/${slug}/definition";\n${importMarker}`,
  )
  .replace(entryMarker, `  { definition: ${camel}Definition, components: ${camel}Components },\n${entryMarker}`);
writeFileSync(registryPath, registry);

const stylesPath = join(root, "src", "themes", "styles.css");
writeFileSync(stylesPath, `${readFileSync(stylesPath, "utf8").trimEnd()}\n@import "./implementations/${slug}/styles.css";\n`);

console.log(`Created ${dir}

Next:
  1. pnpm dev, then open /preview/themes/${slug}
  2. Edit definition.ts, components.ts and custom-sections.tsx
  3. pnpm theme:check
  4. pnpm themes:seed <timestamp>_seed_${slug.replaceAll("-", "_")} --only ${slug}
  5. Commit, push the migration, deploy, then publish it from /admin/themes`);
