# Building themes

Themes are React and Tailwind code in this repository. They go live through a normal commit, migration and deploy, then an admin reviews and publishes them. Uploaded code is never executed: that is what keeps one leaked admin password from taking over the platform.

After a theme is live, admins can upload data-only variants of it (new colors, fonts, content and images) without a developer. See [theme-packages.md](theme-packages.md).

Lexora (`src/themes/implementations/lexora`) is the complete reference theme. It has its own header, footer, versions of every built-in section, and eight sections of its own.

## The theme collection

`src/themes/collection` holds 50 ready-made themes, one for each marketplace category (restaurant, salon, law firm, gym and so on). They are not separate codebases. Each one is a profile (colors, fonts, logo icon, header wording and sample content) built on one of two base designs:

| Base design | Feel | Used for |
|---|---|---|
| Crestview | Classic: serif headings, announcement bar, deep color with an accent | Professional services, healthcare, property, hotels |
| Little Sprouts | Playful: rounded cards, pill header, five decoration colors | Cafes, fitness, creative studios, shops, events |

A collection theme renders with `data-theme="<its id>"` and `data-theme-family="<base design>"`, so it shares the base design's stylesheet. Its accent colors reach the page through `rootVariables`, and its wording through the base design's copy (`crestview/copy.ts`, `sprouts/copy.ts`).

To add one:

1. Add a profile to a file in `src/themes/collection/profiles/`. `pnpm theme:check` tells you if any text is too long, a link is broken or a color fails contrast. Colors are darkened automatically until text passes WCAG AA.
2. Generate its artwork. Images are flat illustrations in the theme's colors, written to `public/themes/<slug>/`:

   ```bash
   pnpm themes:art
   ```

3. Seed it. A new migration with only the new slug keeps existing rows untouched:

   ```bash
   pnpm themes:seed 20261201000020_seed_my_theme --only my-theme
   ```

4. Publish it at `/admin/themes`. New themes arrive as Under review, and the page has a button to publish every theme under review at once.

## Quick start

```bash
pnpm theme:new my-theme --name "My Theme"
```

```bash
pnpm dev
```

Open `http://localhost:3000/preview/themes/my-theme` while you work.

```bash
pnpm theme:check
```

```bash
pnpm themes:seed 20261201000014_seed_my_theme --only my-theme
```

Then commit, push the migration (`pnpm exec supabase db push --linked`), deploy, and publish the theme at `/admin/themes`. A new theme arrives as Under Review, so nobody sees it before you publish.

## Folder structure

```text
src/themes/implementations/my-theme/
  definition.ts        plain data: name, tokens, categories, sample pages (no React)
  components.ts        maps section types to React components
  custom-sections.tsx  section types only this theme offers
  styles.css           theme CSS, scoped to [data-theme="my-theme"]
public/themes/my-theme/  sample images used by definition.ts
```

`theme:new` also registers the theme in `src/themes/registry.ts` and imports its stylesheet in `src/themes/styles.css`.

## Rules a theme must follow

| Rule | Why |
|---|---|
| Use CSS variables (`var(--site-primary)`, `--site-text`, `--site-muted`, `--site-surface`, `--site-border`, `--site-background`, `--site-radius`) instead of fixed colors | Owners change colors and fonts in the editor |
| Headings use `--site-font-heading`, body text `--site-font-body` | Same reason, for fonts |
| Scope all CSS to `[data-theme="<id>"]` | Themes must not affect the platform or each other |
| Render full content on the server. Scripts may add motion only | Marketplace previews run without scripts, so content gated on JavaScript shows as blank |
| Use `next/link` with `resolveHref(href)` for links in content | Links must work in previews, drafts and live sites |
| Use plain `<img>`, not `next/image` | Owners use images from any host |
| Validate every text, link and image with `fieldSchemas` | Content is untrusted, and the schema is what blocks `javascript:` links and unsafe images |
| One `h1` per page | Set `providesPageHeading: true` on a custom section that renders the h1 |
| Never fetch data, read cookies or call APIs from a section | A section displays its props and nothing else |

## Custom sections

```tsx
export const pricingTable = defineSection({
  label: "Pricing table",
  schema: z.object({ title: f.shortText, plans: z.array(z.object({ name: f.shortText, price: f.shortText })).min(1).max(6) }),
  fields: [
    { kind: "text", key: "title", label: "Title" },
    { kind: "list", key: "plans", label: "Plans", itemLabel: "Plan", newItem: { name: "Plan", price: "₹0" }, fields: [
      { kind: "text", key: "name", label: "Name" },
      { kind: "text", key: "price", label: "Price" },
    ] },
  ],
  defaults: { title: "Pricing", plans: [{ name: "Plan", price: "₹0" }] },
  component: ({ props }) => <section>{/* your markup */}</section>,
});
```

Add it to the theme's `customSections` under a lowercase-hyphenated key that is not a built-in type (`hero`, `features`, `about`, `services`, `gallery`, `testimonials`, `stats`, `cta`, `contact`).

The editor builds its form from `fields`. Field kinds are `text`, `textarea`, `link`, `image` (an object with `src` and `alt`), `imageUrl` (a URL string), `button` (`label` and `href`), `select` (with `options`) and `list` (with nested `fields`).

## What `theme:check` verifies

For every registered theme:

- Sample content passes every section's schema, and every section renders.
- Each page has exactly one h1, links point to pages that exist, and sample images exist.
- Text and button colors meet WCAG AA contrast.
- Custom sections have valid names, labels and defaults, and fields that match their schema.
- Unsafe links, images, colors and unknown section types are refused.
- The database seed matches the code. If not, run `pnpm themes:seed`.

The check does not look at your design, so open the preview on desktop and mobile as well.

## Changing a live theme

A version that websites use must keep rendering the same way. For changes beyond fixes:

1. Copy the theme's entry to a new version (`version: "1.1.0"`) and keep the old entry registered.
2. Run `pnpm themes:seed` for the new version, push and deploy.
3. Activate the new version in `/admin/themes`. New websites use it, and existing websites stay on theirs.
