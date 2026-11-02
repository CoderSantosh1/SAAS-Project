import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getThemePreviewDocument } from "@/features/themes/preview";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { findPage, SiteRenderer } from "@/themes/renderer";
import { createStarterDocument, getThemeDefinitionBySlug } from "@/themes/registry";
import { siteFontClassName } from "@/themes/shared/fonts";

type Params = { themeSlug: string; page?: string[] };

// Never cached as a page, so an unpublished theme stops being viewable at once.
export const dynamic = "force-dynamic";

// Built-in themes come from code. Uploaded ones come from the database, which returns
// only published themes here, because this client reads as a visitor.
async function loadDocument(slug: string) {
  const definition = getThemeDefinitionBySlug(slug);
  if (definition) return { name: definition.name, document: createStarterDocument(definition) };
  if (!/^[a-z0-9-]+$/.test(slug) || !isSupabaseConfigured()) return null;

  const { data, error } = await createPublicClient().rpc("get_theme_preview", { p_theme_slug: slug });
  if (error) throw new Error(`Could not load theme preview: ${error.message}`);
  return getThemePreviewDocument(data);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { themeSlug } = await params;
  const loaded = await loadDocument(themeSlug);
  return {
    title: loaded ? `${loaded.name} preview` : "Theme preview",
    robots: { index: false },
  };
}

// Shows a theme with its own starter content, for the marketplace preview.
export default async function ThemePreviewPage({ params }: { params: Promise<Params> }) {
  const { themeSlug, page: pagePath } = await params;
  if (pagePath && pagePath.length > 1) notFound();

  const loaded = await loadDocument(themeSlug);
  if (!loaded) notFound();

  const page = findPage(loaded.document, pagePath?.[0]);
  if (!page) notFound();

  return (
    <SiteRenderer
      document={loaded.document}
      page={page}
      basePath={`/preview/themes/${themeSlug}`}
      className={siteFontClassName}
    />
  );
}
