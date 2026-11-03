import { About, FeaturesCentered, GalleryGrid, ServicesCards, TestimonialsCards } from "../../shared/sections";
import type { ThemeComponents } from "../../types";
import { bloomCustomSections } from "./custom-sections";
import { BloomHeader } from "./header";
import { Contact, Cta, Footer, Hero, Stats } from "./sections";

export const bloomComponents: ThemeComponents = {
  Header: BloomHeader,
  Footer,
  sections: {
    hero: Hero,
    features: FeaturesCentered,
    about: About,
    services: ServicesCards,
    gallery: GalleryGrid,
    testimonials: TestimonialsCards,
    stats: Stats,
    cta: Cta,
    contact: Contact,
  },
  customSections: bloomCustomSections,
};
