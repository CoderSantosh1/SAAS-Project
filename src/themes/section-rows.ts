import { z } from "zod";
import { listSectionDefinitions } from "./sections";
import type { RegisteredTheme } from "./types";

type PageLike = { sections: { type: string; props: unknown }[] };

// The theme_sections rows for a theme version: every section type it offers, with the
// first sample props found in its pages and a JSON Schema the editor can use.
export function buildSectionRows(theme: RegisteredTheme, pages: PageLike[]) {
  const firstUse = new Map<string, unknown>();
  for (const page of pages) {
    for (const section of page.sections) {
      if (!firstUse.has(section.type)) firstUse.set(section.type, section.props);
    }
  }

  return listSectionDefinitions(theme).map((definition) => ({
    type: definition.type,
    label: definition.label,
    default_props: firstUse.get(definition.type) ?? definition.defaults,
    props_schema: z.toJSONSchema(definition.schema, { unrepresentable: "any" }),
  }));
}
