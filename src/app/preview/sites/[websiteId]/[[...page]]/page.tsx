import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getDraftDocument } from "@/features/websites/queries";
import { requireUser } from "@/lib/auth/session";
import { findPage, SiteRenderer } from "@/themes/renderer";
import { siteFontClassName } from "@/themes/shared/fonts";

export const metadata: Metadata = { title: "Draft preview", robots: { index: false } };

type Params = { websiteId: string; page?: string[] };

// A private draft. RLS returns nothing unless this user may read the website.
export default async function DraftPreviewPage({ params }: { params: Promise<Params> }) {
  await requireUser();
  const { websiteId, page: pagePath } = await params;
  if (!z.uuid().safeParse(websiteId).success || (pagePath && pagePath.length > 1)) notFound();

  const document = await getDraftDocument(websiteId);
  if (!document) notFound();

  const page = findPage(document, pagePath?.[0]);
  if (!page) notFound();

  return (
    <SiteRenderer
      document={document}
      page={page}
      basePath={`/preview/sites/${websiteId}`}
      className={siteFontClassName}
    />
  );
}
