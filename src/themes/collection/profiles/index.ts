import type { CollectionProfile } from "../types";
import { businessProfiles } from "./business";
import { commerceProfiles } from "./commerce";
import { creativeProfiles } from "./creative";
import { educationProfiles } from "./education";
import { healthProfiles } from "./health";
import { hospitalityProfiles } from "./hospitality";

// One profile per marketplace category, in the order the categories are listed.
export const PROFILES: CollectionProfile[] = [
  ...businessProfiles,
  ...creativeProfiles,
  ...healthProfiles,
  ...educationProfiles,
  ...hospitalityProfiles,
  ...commerceProfiles,
];
