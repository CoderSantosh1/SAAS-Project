import { About, ServicesCards } from "../../shared/sections";
import type { ThemeComponents } from "../../types";
import { crestviewCustomSections } from "./custom-sections";
import { CrestviewHeader } from "./header";
import { Contact, Cta, Features, Footer, Gallery, Stats, Testimonials } from "./sections";
import { HeroOverlay } from "../../shared/sections";

export const crestviewComponents: ThemeComponents = {
  Header: CrestviewHeader,
  Footer,
  sections: {
    hero: HeroOverlay,
    features: Features,
    about: About,
    services: ServicesCards,
    gallery: Gallery,
    testimonials: Testimonials,
    stats: Stats,
    cta: Cta,
    contact: Contact,
  },
  customSections: crestviewCustomSections,
};
