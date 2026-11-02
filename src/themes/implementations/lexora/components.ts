import type { ThemeComponents } from "../../types";
import { lexoraCustomSections } from "./custom-sections";
import { LexoraHeader } from "./interactive";
import { About, Contact, Cta, Features, Footer, Gallery, Hero, Services, Stats, Testimonials } from "./sections";

export const lexoraComponents: ThemeComponents = {
  Header: LexoraHeader,
  Footer,
  sections: {
    hero: Hero,
    features: Features,
    about: About,
    services: Services,
    gallery: Gallery,
    testimonials: Testimonials,
    stats: Stats,
    cta: Cta,
    contact: Contact,
  },
  customSections: lexoraCustomSections,
};
