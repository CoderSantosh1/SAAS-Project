import type { ComponentType } from "react";
import { z } from "zod";

// All site content is untrusted user data. These schemas are what stand between
// stored JSON and the DOM: URLs and colors end up in attributes and CSS variables.

function isSafeLink(value: string) {
  return (
    /^(https?:\/\/|mailto:|tel:|#)/i.test(value) ||
    (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"))
  );
}

function isSafeImage(value: string) {
  return (
    /^https?:\/\//i.test(value) ||
    (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"))
  );
}

const shortText = z.string().trim().min(1).max(200);
const longText = z.string().trim().min(1).max(2000);
const link = z.string().max(2048).refine(isSafeLink, "Enter a valid link");

const button = z.object({ label: z.string().trim().min(1).max(60), href: link });
export const imageUrlSchema = z.string().max(2048).refine(isSafeImage, "Enter a valid image URL");
const image = z.object({
  src: imageUrlSchema,
  alt: z.string().max(200),
});

export const sectionSchemas = {
  hero: z.object({
    eyebrow: shortText.optional(),
    heading: shortText,
    subheading: longText.optional(),
    primaryButton: button.optional(),
    secondaryButton: button.optional(),
    image: image.optional(),
  }),
  features: z.object({
    heading: shortText,
    subheading: longText.optional(),
    items: z.array(z.object({ title: shortText, description: longText })).min(1).max(12),
  }),
  about: z.object({
    heading: shortText,
    body: longText,
    image: image.optional(),
  }),
  services: z.object({
    heading: shortText,
    subheading: longText.optional(),
    items: z
      .array(
        z.object({
          name: shortText,
          description: longText.optional(),
          price: z.string().trim().min(1).max(40).optional(),
        }),
      )
      .min(1)
      .max(40),
  }),
  gallery: z.object({
    heading: shortText.optional(),
    images: z.array(image.extend({ caption: shortText.optional() })).min(1).max(24),
  }),
  testimonials: z.object({
    heading: shortText.optional(),
    items: z
      .array(z.object({ quote: longText, author: shortText, role: shortText.optional() }))
      .min(1)
      .max(12),
  }),
  stats: z.object({
    items: z
      .array(z.object({ value: z.string().trim().min(1).max(20), label: shortText }))
      .min(1)
      .max(6),
  }),
  cta: z.object({
    heading: shortText,
    body: longText.optional(),
    button,
  }),
  contact: z.object({
    heading: shortText,
    body: longText.optional(),
    email: z.email().optional(),
    phone: z.string().trim().min(3).max(30).regex(/^[+\d][\d\s()-]*$/).optional(),
    address: shortText.optional(),
    hours: shortText.optional(),
  }),
} as const;

export type SectionType = keyof typeof sectionSchemas;
export type SectionProps<T extends SectionType> = z.infer<(typeof sectionSchemas)[T]>;

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  features: "Features",
  about: "About",
  services: "Services",
  gallery: "Gallery",
  testimonials: "Testimonials",
  stats: "Statistics",
  cta: "Call to action",
  contact: "Contact details",
};

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const FONT_IDS = ["inter", "sora", "playfair", "space-grotesk", "lora"] as const;

export const designTokensSchema = z.object({
  primary: hexColor,
  onPrimary: hexColor,
  background: hexColor,
  surface: hexColor,
  text: hexColor,
  mutedText: hexColor,
  border: hexColor,
  headingFont: z.enum(FONT_IDS),
  bodyFont: z.enum(FONT_IDS),
  radius: z.enum(["none", "md", "lg"]),
});

export type DesignTokens = z.infer<typeof designTokensSchema>;

const pageSlug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

// Section props stay unknown here. Each one is validated against its type when it
// is rendered, so one bad section cannot take down the whole page.
export const siteDocumentSchema = z.object({
  themeId: z.string().min(1),
  themeVersion: z.string().min(1),
  siteName: z.string().trim().min(1).max(120),
  logoUrl: imageUrlSchema.optional(),
  tokens: designTokensSchema,
  pages: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        slug: pageSlug,
        isHome: z.boolean().default(false),
        isVisible: z.boolean().default(true),
        sections: z.array(
          z.object({
            type: z.string(),
            props: z.unknown(),
            isVisible: z.boolean().default(true),
          }),
        ),
      }),
    )
    .min(1),
});

export type SiteDocument = z.infer<typeof siteDocumentSchema>;
export type SitePage = SiteDocument["pages"][number];

export type StarterSection = {
  [T in SectionType]: { type: T; props: SectionProps<T> };
}[SectionType];

export type StarterPage = {
  title: string;
  slug: string;
  isHome?: boolean;
  sections: StarterSection[];
};

// Plain data about a theme. Kept free of React so scripts and tests can read it.
export type ThemeDefinition = {
  componentId: string;
  version: string;
  name: string;
  slug: string;
  description: string;
  authorName: string;
  primaryCategory: string;
  categories: string[];
  isFeatured: boolean;
  supportedFeatures: string[];
  compatibility: { minDocumentVersion: number };
  tokens: DesignTokens;
  pages: StarterPage[];
};

export type SectionComponentProps<T extends SectionType> = {
  props: SectionProps<T>;
  resolveHref: (href: string) => string;
};

export type ThemeComponents = {
  sections: { [T in SectionType]: ComponentType<SectionComponentProps<T>> };
  Header: ComponentType<{
    siteName: string;
    logoUrl?: string;
    homeHref: string;
    links: { label: string; href: string }[];
  }>;
  Footer: ComponentType<{ siteName: string }>;
};

export type RegisteredTheme = {
  definition: ThemeDefinition;
  components: ThemeComponents;
};
