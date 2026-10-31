import { atelierComponents } from "./implementations/atelier/components";
import { atelierDefinition } from "./implementations/atelier/definition";
import { hearthComponents } from "./implementations/hearth/components";
import { hearthDefinition } from "./implementations/hearth/definition";
import { meridianComponents } from "./implementations/meridian/components";
import { meridianDefinition } from "./implementations/meridian/definition";
import type { RegisteredTheme, SiteDocument, ThemeDefinition } from "./types";

// The only themes that can render. Published sites record the exact version they
// use, so keep old entries here when a theme gets a new version.
const REGISTERED_THEMES: RegisteredTheme[] = [
  { definition: meridianDefinition, components: meridianComponents },
  { definition: atelierDefinition, components: atelierComponents },
  { definition: hearthDefinition, components: hearthComponents },
];

export function getTheme(componentId: string, version: string) {
  return (
    REGISTERED_THEMES.find(
      ({ definition }) => definition.componentId === componentId && definition.version === version,
    ) ?? null
  );
}

export function listThemeDefinitions(): ThemeDefinition[] {
  return REGISTERED_THEMES.map(({ definition }) => definition);
}

export function getThemeDefinitionBySlug(slug: string) {
  return listThemeDefinitions().find((definition) => definition.slug === slug) ?? null;
}

export function createStarterDocument(definition: ThemeDefinition, siteName = definition.name): SiteDocument {
  return {
    themeId: definition.componentId,
    themeVersion: definition.version,
    siteName,
    tokens: definition.tokens,
    pages: definition.pages.map((page) => ({
      title: page.title,
      slug: page.slug,
      isHome: page.isHome ?? false,
      isVisible: true,
      sections: page.sections.map((section) => ({ ...section, isVisible: true })),
    })),
  };
}
