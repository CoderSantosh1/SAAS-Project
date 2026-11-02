import { getSectionDefinition } from "@/themes/sections";
import type { RegisteredTheme } from "@/themes/types";

export function sectionLabel(theme: RegisteredTheme | null, type: string) {
  return getSectionDefinition(theme, type)?.label ?? "Unknown section";
}
