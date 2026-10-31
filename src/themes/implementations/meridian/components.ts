import {
  About,
  Contact,
  Cta,
  FeaturesCards,
  FooterSimple,
  GalleryGrid,
  HeaderBar,
  HeroSplit,
  ServicesCards,
  Stats,
  TestimonialsCards,
} from "../../shared/sections";
import type { ThemeComponents } from "../../types";

export const meridianComponents: ThemeComponents = {
  Header: HeaderBar,
  Footer: FooterSimple,
  sections: {
    hero: HeroSplit,
    features: FeaturesCards,
    about: About,
    services: ServicesCards,
    gallery: GalleryGrid,
    testimonials: TestimonialsCards,
    stats: Stats,
    cta: Cta,
    contact: Contact,
  },
};
