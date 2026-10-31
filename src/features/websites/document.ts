import { getTheme } from "@/themes/registry";
import { parseSiteDocument } from "@/themes/renderer";
import { imageUrlSchema, type SiteDocument } from "@/themes/types";
import { z } from "zod";

export type WebsiteDraft = {
  id: string;
  name: string;
  business_name: string | null;
  component_id: string | null;
  version: string | null;
  design: Record<string, unknown>;
  pages: {
    title: string;
    slug: string;
    isHome?: boolean;
    isVisible?: boolean;
    sections: { type: string; props: unknown; isVisible?: boolean }[];
  }[];
};

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

function readableOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Picks whichever of the two has the higher contrast against the color.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.0555 ? "#FFFFFF" : "#111111";
}

// Combines the draft stored in the database with the code-level theme. Stored design
// values are untrusted, so invalid ones fall back to the theme's own.
export function buildDraftDocument(draft: WebsiteDraft): SiteDocument | null {
  if (!draft.component_id || !draft.version) return null;

  const theme = getTheme(draft.component_id, draft.version);
  if (!theme) return null;

  const tokens = { ...theme.definition.tokens };
  const primary = hexColor.safeParse(draft.design.primary);
  if (primary.success) {
    tokens.primary = primary.data;
    tokens.onPrimary = readableOn(primary.data);
  }
  const logoUrl = imageUrlSchema.safeParse(draft.design.logoUrl);

  return parseSiteDocument({
    themeId: draft.component_id,
    themeVersion: draft.version,
    siteName: draft.business_name || draft.name,
    logoUrl: logoUrl.success ? logoUrl.data : undefined,
    tokens,
    pages: draft.pages,
  });
}
