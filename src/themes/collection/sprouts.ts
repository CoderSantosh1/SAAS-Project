import { createSproutsComponents } from "../implementations/sprouts/components";
import { SPROUTS_COPY } from "../implementations/sprouts/copy";
import type { ThemeComponents } from "../types";
import { playfulPalette } from "./colors";
import type { CollectionProfile } from "./types";

// Little Sprouts' components with a collection theme's wording, logo mark and colors.
export function sproutsCollectionComponents(profile: CollectionProfile): ThemeComponents {
  return createSproutsComponents(
    {
      ...SPROUTS_COPY,
      headerCta: profile.copy.cta,
      ctaPages: ["contact"],
      footerTagline: profile.copy.tagline,
      footerNote: "All rights reserved.",
      testimonialsEyebrow: "Happy clients",
      galleryEyebrow: profile.galleryPage[0],
      contactEyebrow: "Get in touch",
      contactLabels: { phone: "Phone", email: "Email", address: "Visit us", hours: profile.contact.hoursLabel ?? "Opening hours" },
      mark: profile.mark,
    },
    playfulPalette(profile.primary, profile.accent),
  );
}
