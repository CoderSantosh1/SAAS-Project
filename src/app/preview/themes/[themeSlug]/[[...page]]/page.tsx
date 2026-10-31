import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findPage, SiteRenderer } from "@/themes/renderer";
import { createStarterDocument, getThemeDefinitionBySlug, listThemeDefinitions } from "@/themes/registry";
import { siteFontClassName } from "@/themes/shared/fonts";

type Params = { themeSlug: string; page?: string[] };

export const dynamicParams = false;

export function generateStaticParams() {
  return listThemeDefinitions().flatMap((definition) =>
    definition.pages.map((page) => ({
      themeSlug: definition.slug,
      page: page.isHome ? [] : [page.slug],
    })),
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { themeSlug } = await params;
  const definition = getThemeDefinitionBySlug(themeSlug);
  return {
    title: definition ? `${definition.name} preview` : "Theme preview",
    robots: { index: false },
  };
}

// Shows a theme with its own starter content, for the marketplace preview.
export default async function ThemePreviewPage({ params }: { params: Promise<Params> }) {
  const { themeSlug, page: pagePath } = await params;
  const definition = getThemeDefinitionBySlug(themeSlug);
  if (!definition || (pagePath && pagePath.length > 1)) notFound();

  const document = createStarterDocument(definition);
  const page = findPage(document, pagePath?.[0]);
  if (!page) notFound();

  return (
    <SiteRenderer
      document={document}
      page={page}
      basePath={`/preview/themes/${definition.slug}`}
      className={siteFontClassName}
    />
  );
}
