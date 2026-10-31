import {
  About,
  Contact,
  Cta,
  FeaturesCentered,
  FooterSimple,
  GalleryGrid,
  HeaderCentered,
  HeroOverlay,
  ServicesMenu,
  Stats,
  TestimonialsLarge,
} from "../../shared/sections";
import type { ThemeComponents } from "../../types";

export const hearthComponents: ThemeComponents = {
  Header: HeaderCentered,
  Footer: FooterSimple,
  sections: {
    hero: HeroOverlay,
    features: FeaturesCentered,
    about: About,
    services: ServicesMenu,
    gallery: GalleryGrid,
    testimonials: TestimonialsLarge,
    stats: Stats,
    cta: Cta,
    contact: Contact,
  },
};
