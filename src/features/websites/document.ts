import { getTheme } from "@/themes/registry";
import { parseSiteDocument } from "@/themes/renderer";
import { designTokensSchema, FONT_IDS, imageUrlSchema, type DesignTokens, type SiteDocument } from "@/themes/types";
import { z } from "zod";

export type WebsiteDraft = {
  id: string;
  name: string;
  business_name: string | null;
  component_id: string | null;
  version: string | null;
  design_tokens?: unknown;
  design: Record<string, unknown>;
  pages: {
    title: string;
    slug: string;
    isHome?: boolean;
    isVisible?: boolean;
    sections: { type: string; props: unknown; design?: unknown; isVisible?: boolean }[];
  }[];
};

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const font = z.enum(FONT_IDS);
const radius = z.enum(["none", "md", "lg"]);

function readableOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Picks whichever of the two has the higher contrast against the color.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.0555 ? "#FFFFFF" : "#111111";
}

// A theme version's own tokens, which is how an uploaded theme differs from the
// registered component it uses. Falls back to that component's tokens.
export function resolveThemeTokens(stored: unknown, fallback: DesignTokens): DesignTokens {
  const parsed = designTokensSchema.safeParse(stored);
  return parsed.success ? parsed.data : fallback;
}

// Stored design values are untrusted, so invalid ones fall back to the theme's own.
export function applySiteDesign(base: DesignTokens, design: Record<string, unknown>): DesignTokens {
  const tokens = { ...base };
  const primary = hexColor.safeParse(design.primary);
  if (primary.success) {
    tokens.primary = primary.data;
    tokens.onPrimary = readableOn(primary.data);
  }
  const headingFont = font.safeParse(design.headingFont);
  if (headingFont.success) tokens.headingFont = headingFont.data;
  const bodyFont = font.safeParse(design.bodyFont);
  if (bodyFont.success) tokens.bodyFont = bodyFont.data;
  const corners = radius.safeParse(design.radius);
  if (corners.success) tokens.radius = corners.data;
  return tokens;
}

export function safeLogoUrl(design: Record<string, unknown>) {
  const logoUrl = imageUrlSchema.safeParse(design.logoUrl);
  return logoUrl.success ? logoUrl.data : undefined;
}

// Combines the draft stored in the database with the code-level theme.
export function buildDraftDocument(draft: WebsiteDraft): SiteDocument | null {
  if (!draft.component_id || !draft.version) return null;

  const theme = getTheme(draft.component_id, draft.version);
  if (!theme) return null;

  return parseSiteDocument({
    themeId: draft.component_id,
    themeVersion: draft.version,
    siteName: draft.business_name || draft.name,
    logoUrl: safeLogoUrl(draft.design),
    tokens: applySiteDesign(resolveThemeTokens(draft.design_tokens, theme.definition.tokens), draft.design),
    pages: draft.pages,
  });
}
