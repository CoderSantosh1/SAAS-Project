import { About, HeroSplit, ServicesCards } from "../../shared/sections";
import type { ThemeComponents } from "../../types";
import { sproutsCustomSections } from "./custom-sections";
import { SproutsHeader } from "./header";
import { Contact, Cta, Features, Footer, Gallery, Stats, Testimonials } from "./sections";

export const sproutsComponents: ThemeComponents = {
  Header: SproutsHeader,
  Footer,
  sections: {
    hero: HeroSplit,
    features: Features,
    about: About,
    services: ServicesCards,
    gallery: Gallery,
    testimonials: Testimonials,
    stats: Stats,
    cta: Cta,
    contact: Contact,
  },
  customSections: sproutsCustomSections,
};
