// Writes the sample artwork for every collection theme to public/themes/<slug>/.
//
//   pnpm themes:art
//
// The output is deterministic, and `pnpm theme:check` fails when a file is missing or stale.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { collectionArt } from "../src/themes/collection/art";
import { COLLECTION_PROFILES, COLLECTION_THEMES } from "../src/themes/collection";

let count = 0;
for (const profile of COLLECTION_PROFILES) {
  const theme = COLLECTION_THEMES.find(({ definition }) => definition.slug === profile.slug)!;
  const dir = join(process.cwd(), "public", "themes", profile.slug);
  mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(collectionArt(profile, theme.definition.tokens.primary))) {
    writeFileSync(join(dir, `${name}.svg`), content);
    count++;
  }
}
console.log(`Wrote ${count} images for ${COLLECTION_PROFILES.length} themes.`);
