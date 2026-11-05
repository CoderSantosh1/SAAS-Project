// The fixed wording in Crestview's header, footer and section labels. Crestview itself
// uses the defaults; collection themes built on Crestview swap in their own words.
export type CrestviewCopy = {
  announcement: string;
  barCta: string;
  headerCta: string;
  // Page slugs the header's button may point to, in order of preference.
  ctaPages: string[];
  footerTagline: string;
  footerHeading: string;
  testimonialsEyebrow: string;
  galleryEyebrow: string;
  contactEyebrow: string;
  contactLabels: { phone: string; email: string; address: string; hours: string };
  // An industry icon id for the logo mark. Without one, the shield crest is shown.
  mark?: string;
};

export const CRESTVIEW_COPY: CrestviewCopy = {
  announcement: "Admissions are open for the new academic year",
  barCta: "Apply now",
  headerCta: "Apply Now",
  ctaPages: ["contact", "admissions"],
  footerTagline: "Inspiring curious minds and confident leaders, one class at a time.",
  footerHeading: "Explore",
  testimonialsEyebrow: "Voices",
  galleryEyebrow: "Campus life",
  contactEyebrow: "Get in touch",
  contactLabels: { phone: "Phone", email: "Email", address: "Campus", hours: "Office hours" },
};

