import {
  About,
  Contact,
  Cta,
  FeaturesNumbered,
  FooterSimple,
  GalleryColumns,
  HeaderBar,
  HeroEditorial,
  ServicesCards,
  Stats,
  TestimonialsLarge,
} from "../../shared/sections";
import type { ThemeComponents } from "../../types";

export const atelierComponents: ThemeComponents = {
  Header: HeaderBar,
  Footer: FooterSimple,
  sections: {
    hero: HeroEditorial,
    features: FeaturesNumbered,
    about: About,
    services: ServicesCards,
    gallery: GalleryColumns,
    testimonials: TestimonialsLarge,
    stats: Stats,
    cta: Cta,
    contact: Contact,
  },
};
