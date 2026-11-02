import { resolveThemeTokens } from "@/features/websites/document";
import { getTheme } from "@/themes/registry";
import { parseSiteDocument } from "@/themes/renderer";

type StoredPreview = {
  name: string;
  component_id: string;
  version: string;
  design_tokens: unknown;
  pages: unknown;
};

// Builds a viewable document from a stored theme version. Content is validated again
// here and at render time, so the stored data is never trusted.
export function getThemePreviewDocument(data: unknown) {
  if (!data) return null;
  const stored = data as StoredPreview;

  const theme = getTheme(stored.component_id, stored.version);
  if (!theme) return null;

  const document = parseSiteDocument({
    themeId: stored.component_id,
    themeVersion: stored.version,
    siteName: stored.name,
    tokens: resolveThemeTokens(stored.design_tokens, theme.definition.tokens),
    pages: stored.pages,
  });
  return document ? { name: stored.name, document } : null;
}
