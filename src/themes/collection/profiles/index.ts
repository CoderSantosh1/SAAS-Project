import type { CollectionProfile } from "../types";
import { businessProfiles } from "./business";
import { commerceProfiles } from "./commerce";
import { creativeProfiles } from "./creative";
import { educationProfiles } from "./education";
import { healthProfiles } from "./health";
import { hospitalityProfiles } from "./hospitality";
import { indiaEducationProfiles } from "./india-education";
import { indiaLifestyleProfiles } from "./india-lifestyle";
import { indiaMediaBusinessProfiles } from "./india-media-business";

// One theme for each of the original marketplace categories.
export const CATEGORY_PROFILES: CollectionProfile[] = [
  ...businessProfiles,
  ...creativeProfiles,
  ...healthProfiles,
  ...educationProfiles,
  ...hospitalityProfiles,
  ...commerceProfiles,
];

// Themes for the kinds of websites popular in India: schools, coaching, training, news
// and media, CA firms, sweet shops, jewellers, temples and more.
export const INDIA_PROFILES: CollectionProfile[] = [...indiaEducationProfiles, ...indiaMediaBusinessProfiles, ...indiaLifestyleProfiles];

export const PROFILES: CollectionProfile[] = [...CATEGORY_PROFILES, ...INDIA_PROFILES];
