# Theme packages

Admins upload themes at `/admin/themes/new`. The easiest start is a starter package from that page, which is always valid.

A package is a ZIP of at most 25 MB containing only:

```text
theme.json         required, at the top level, not inside a folder
assets/hero.png    optional images: png, jpg, jpeg, webp, gif or avif, up to 10 MB each
```

Every other file is refused, including JavaScript, TypeScript, HTML, SVG and nested folders in `assets`. The whole package is rejected if anything fails, and nothing is stored. System files such as `.DS_Store` and `__MACOSX` are ignored.

## theme.json

```json
{
  "schemaVersion": 1,
  "component": { "id": "hearth", "version": "1.0.0" },
  "tokens": {
    "primary": "#0F766E",
    "onPrimary": "#FFFFFF",
    "background": "#F0FDFA",
    "surface": "#CCFBF1",
    "text": "#134E4A",
    "mutedText": "#115E59",
    "border": "#99F6E4",
    "headingFont": "lora",
    "bodyFont": "inter",
    "radius": "lg"
  },
  "pages": [
    {
      "title": "Home",
      "slug": "home",
      "isHome": true,
      "sections": [
        {
          "type": "hero",
          "props": {
            "heading": "Welcome",
            "image": { "src": "assets/hero.png", "alt": "Our studio" }
          }
        }
      ]
    }
  ]
}
```

| Field | Rules |
|---|---|
| `component` | An approved component and version from `src/themes/registry.ts`: `meridian`, `atelier`, `hearth` or `lexora` |
| `tokens` | Six-digit hex colors. Fonts: `inter`, `sora`, `playfair`, `space-grotesk`, `lora`, `cormorant`. Radius: `none`, `md`, `lg` |
| `pages` | 1 to 50 pages, exactly one with `isHome`, and each with a different slug |
| `sections[].type` | `hero`, `features`, `about`, `services`, `gallery`, `testimonials`, `stats`, `cta`, `contact`, plus the component's own types (Lexora adds `slideshow`, `page-hero`, `intro-collage`, `photo-cards`, `quote-banner`, `team`, `faq`, `image-strip`) |
| `sections[].props` | Must match that section's schema in `src/themes/types.ts` |
| `assets/...` values | Any string starting with `assets/` must name a file in the package. It becomes the public image address on upload |

## What a package cannot do

A package changes colors, fonts, content and images, and it uses the layouts of its approved component. A new layout or section type requires a developer to add it to the code and redeploy. This is deliberate: uploaded code is never executed.

## Lifecycle

1. **Upload.** The theme starts as Under Review, visible only to admins with `themes.manage`.
2. **Review.** The manage page previews it on desktop, tablet and mobile.
3. **Publish.** It joins the marketplace in its category. A category is required.
4. **New version.** Uploading one changes nothing until it is activated.
5. **Activate or roll back.** New websites use the active version. Existing websites stay on the version they were built on, and there is no automatic migration between versions.
6. **Archive or delete.** Delete is available only for an unpublished theme with no websites. Its stored ZIP and image files are not removed yet.
