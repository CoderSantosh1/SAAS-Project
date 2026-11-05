import { About, HeroOverlay, ServicesCards } from "../../shared/sections";
import type { ThemeComponents } from "../../types";
import { CRESTVIEW_COPY, type CrestviewCopy } from "./copy";
import { crestviewCustomSections } from "./custom-sections";
import { CrestviewHeader } from "./header";
import { Contact, Cta, Features, Footer, Gallery, Stats, Testimonials } from "./sections";

// Crestview's components with the given wording. Collection themes call this with their
// own copy; the family stays "crestview" so they share Crestview's stylesheet.
export function createCrestviewComponents(copy: CrestviewCopy = CRESTVIEW_COPY, accent?: string): ThemeComponents {
  return {
    family: "crestview",
    rootVariables: accent ? { "--cv-gold": accent } : undefined,
    Header: (props) => <CrestviewHeader {...props} copy={copy} />,
    Footer: (props) => <Footer {...props} copy={copy} />,
    sections: {
      hero: HeroOverlay,
      features: Features,
      about: About,
      services: ServicesCards,
      gallery: (props) => <Gallery {...props} copy={copy} />,
      testimonials: (props) => <Testimonials {...props} copy={copy} />,
      stats: Stats,
      cta: Cta,
      contact: (props) => <Contact {...props} copy={copy} />,
    },
    customSections: crestviewCustomSections,
  };
}

export const crestviewComponents = createCrestviewComponents();
