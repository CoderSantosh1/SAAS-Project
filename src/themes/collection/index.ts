import type { RegisteredTheme } from "../types";
import { buildDefinition } from "./build";
import { crestviewCollectionComponents } from "./crestview";
import { PROFILES } from "./profiles";
import { sproutsCollectionComponents } from "./sprouts";

// The theme collection: one ready-made theme per marketplace category, each built on one
// of the two base designs with its own colors, fonts, wording, pages and artwork.
// Add a theme by adding a profile, then run `pnpm themes:art` and `pnpm themes:seed`.

export const COLLECTION_PROFILES = PROFILES;

export const COLLECTION_THEMES: RegisteredTheme[] = PROFILES.map((profile) => ({
  definition: buildDefinition(profile),
  components: profile.base === "crestview" ? crestviewCollectionComponents(profile) : sproutsCollectionComponents(profile),
}));

export function getCollectionProfile(slug: string) {
  return PROFILES.find((profile) => profile.slug === slug) ?? null;
}
