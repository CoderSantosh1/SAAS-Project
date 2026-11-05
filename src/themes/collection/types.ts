import type { DesignTokens } from "../types";

// One collection theme, as plain data. A builder turns it into a full multi-page theme on
// one of the two base designs: Crestview (classic, serif, announcement bar) or Little
// Sprouts (playful, rounded, colorful). Keep every string short enough for its schema.
export type CollectionBase = "crestview" | "sprouts";

type Pair = readonly [string, string];

export type CollectionProfile = {
  slug: string;
  name: string;
  base: CollectionBase;
  // The category the theme is listed under first, plus any others it suits.
  category: string;
  categories?: string[];
  description: string;
  featured?: boolean;

  primary: string;
  accent: string;
  headingFont: DesignTokens["headingFont"];
  bodyFont: DesignTokens["bodyFont"];
  radius?: DesignTokens["radius"];

  // Industry icon ids: the logo mark, and four used for cards, points and artwork.
  mark: string;
  icons: readonly [string, string, string, string];

  copy: { announcement: string; cta: string; tagline: string };
  // The services page and the gallery page get industry names, such as Menu or Portfolio.
  servicesPage: Pair;
  galleryPage: Pair;

  hero: { eyebrow: string; title: string; highlight?: string; text: string; primary: string; secondary: string };
  facts: readonly [Pair, Pair, Pair, Pair];
  intro: { eyebrow: string; title: string; text: string; quote: string; name: string; role: string };
  services: { eyebrow: string; title: string; text: string; items: readonly (readonly [string, string, string])[] };
  values: { title: string; text: string; items: readonly Pair[] };
  team: { title: string; members: readonly [Pair, Pair, Pair, Pair] };
  steps: { title: string; text: string; items: readonly [Pair, Pair, Pair, Pair] };
  faqs: readonly Pair[];
  testimonials: readonly [readonly [string, string, string], readonly [string, string, string], readonly [string, string, string]];
  contact: { heading: string; body: string; email: string; phone: string; address: string; hours: string; hoursLabel?: string };
};
