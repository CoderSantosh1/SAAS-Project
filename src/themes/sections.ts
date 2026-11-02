import type { ComponentType } from "react";
import type { z } from "zod";
import { SECTION_DEFAULTS, SECTION_FIELDS } from "./shared/section-fields";
import { SECTION_LABELS, sectionSchemas, type RegisteredTheme, type SectionField, type SectionType } from "./types";

export type SectionDefinition = {
  type: string;
  label: string;
  custom: boolean;
  schema: z.ZodType;
  fields: SectionField[];
  defaults: Record<string, unknown>;
  component: ComponentType<{ props: never; resolveHref: (href: string) => string }>;
};

function isBuiltIn(type: string): type is SectionType {
  return Object.hasOwn(sectionSchemas, type);
}

// The single place that decides what a section type means for a theme. Anything it does
// not know returns null and is never rendered.
export function getSectionDefinition(theme: RegisteredTheme | null, type: string): SectionDefinition | null {
  if (isBuiltIn(type)) {
    return {
      type,
      label: SECTION_LABELS[type],
      custom: false,
      schema: sectionSchemas[type],
      fields: SECTION_FIELDS[type],
      defaults: SECTION_DEFAULTS[type],
      component: (theme?.components.sections[type] ?? (() => null)) as SectionDefinition["component"],
    };
  }

  const custom = theme?.components.customSections;
  if (!custom || !Object.hasOwn(custom, type)) return null;
  const section = custom[type]!;
  return { type, custom: true, ...section, component: section.component as SectionDefinition["component"] };
}

// Built-in types first, then the theme's own, in the order the theme lists them.
export function listSectionDefinitions(theme: RegisteredTheme | null): SectionDefinition[] {
  const types = [...Object.keys(sectionSchemas), ...Object.keys(theme?.components.customSections ?? {})];
  return types.map((type) => getSectionDefinition(theme, type)!).filter(Boolean);
}

export function sectionIssues(definition: SectionDefinition | null, props: unknown): Record<string, string> {
  if (!definition) return {};
  const parsed = definition.schema.safeParse(props);
  if (parsed.success) return {};
  const issues: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".");
    issues[key] ??= issue.code === "invalid_type" || issue.code === "too_small" ? "This is required." : issue.message;
  }
  return issues;
}
