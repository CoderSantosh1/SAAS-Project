// The fixed wording in Little Sprouts' header, footer and section labels. Sprouts itself
// uses the defaults; collection themes built on Sprouts swap in their own words.
export type SproutsCopy = {
  headerCta: string;
  // Page slugs the header's button may point to, in order of preference.
  ctaPages: string[];
  footerTagline: string;
  footerNote: string;
  testimonialsEyebrow: string;
  galleryEyebrow: string;
  contactEyebrow: string;
  contactLabels: { phone: string; email: string; address: string; hours: string };
  // An icon id from the theme's icon set for the logo mark.
  mark: string;
};

export const SPROUTS_COPY: SproutsCopy = {
  headerCta: "Enroll Now",
  ctaPages: ["contact", "enroll", "admissions"],
  footerTagline: "A happy, safe place to play, learn and grow.",
  footerNote: "Made with love for little learners.",
  testimonialsEyebrow: "Happy parents",
  galleryEyebrow: "Our photo wall",
  contactEyebrow: "Say hello",
  contactLabels: { phone: "Call us", email: "Email us", address: "Visit us", hours: "School hours" },
  mark: "sprout",
};

// The playful decoration colors. Collection themes may replace them with their own set.
export type SproutsPalette = { sun: string; coral: string; mint: string; grape: string; sky: string };
