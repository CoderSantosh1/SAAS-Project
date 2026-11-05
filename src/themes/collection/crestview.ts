import { createCrestviewComponents } from "../implementations/crestview/components";
import { CRESTVIEW_COPY } from "../implementations/crestview/copy";
import type { ThemeComponents } from "../types";
import type { CollectionProfile } from "./types";

// Crestview's components with a collection theme's wording, logo mark and accent color.
export function crestviewCollectionComponents(profile: CollectionProfile): ThemeComponents {
  return createCrestviewComponents(
    {
      ...CRESTVIEW_COPY,
      announcement: profile.copy.announcement,
      barCta: profile.copy.cta,
      headerCta: profile.copy.cta,
      ctaPages: ["contact"],
      footerTagline: profile.copy.tagline,
      testimonialsEyebrow: "Testimonials",
      galleryEyebrow: profile.galleryPage[0],
      contactLabels: { phone: "Phone", email: "Email", address: "Visit us", hours: profile.contact.hoursLabel ?? "Opening hours" },
      mark: profile.mark,
    },
    profile.accent,
  );
}
