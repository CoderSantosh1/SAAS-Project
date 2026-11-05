import { About, HeroSplit, ServicesCards } from "../../shared/sections";
import type { ThemeComponents } from "../../types";
import { SPROUTS_COPY, type SproutsCopy, type SproutsPalette } from "./copy";
import { sproutsCustomSections } from "./custom-sections";
import { SproutsHeader } from "./header";
import { Contact, Cta, Features, Footer, Gallery, Stats, Testimonials } from "./sections";

// Little Sprouts' components with the given wording and decoration colors. Collection
// themes call this; the family stays "sprouts" so they share its stylesheet.
export function createSproutsComponents(copy: SproutsCopy = SPROUTS_COPY, palette?: SproutsPalette): ThemeComponents {
  return {
    family: "sprouts",
    rootVariables: palette
      ? { "--sp-sun": palette.sun, "--sp-coral": palette.coral, "--sp-mint": palette.mint, "--sp-grape": palette.grape, "--sp-sky": palette.sky }
      : undefined,
    Header: (props) => <SproutsHeader {...props} copy={copy} />,
    Footer: (props) => <Footer {...props} copy={copy} />,
    sections: {
      hero: HeroSplit,
      features: Features,
      about: About,
      services: ServicesCards,
      gallery: (props) => <Gallery {...props} copy={copy} />,
      testimonials: (props) => <Testimonials {...props} copy={copy} />,
      stats: Stats,
      cta: Cta,
      contact: (props) => <Contact {...props} copy={copy} />,
    },
    customSections: sproutsCustomSections,
  };
}

export const sproutsComponents = createSproutsComponents();
