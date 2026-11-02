import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getAdminThemeVersionDocument } from "@/features/themes/queries";
import { requireAdmin } from "@/lib/auth/session";
import { findPage, SiteRenderer } from "@/themes/renderer";
import { siteFontClassName } from "@/themes/shared/fonts";

export const metadata: Metadata = { title: "Theme review", robots: { index: false } };

type Params = { versionId: string; page?: string[] };

// Lets an admin review any version, including ones not yet visible to anyone else.
export default async function AdminThemePreviewPage({ params }: { params: Promise<Params> }) {
  await requireAdmin("themes.manage");
  const { versionId, page: pagePath } = await params;
  if (!z.uuid().safeParse(versionId).success || (pagePath && pagePath.length > 1)) notFound();

  const loaded = await getAdminThemeVersionDocument(versionId);
  if (!loaded) notFound();

  const page = findPage(loaded.document, pagePath?.[0]);
  if (!page) notFound();

  return (
    <SiteRenderer
      document={loaded.document}
      page={page}
      basePath={`/preview/admin-themes/${versionId}`}
      className={siteFontClassName}
    />
  );
}
