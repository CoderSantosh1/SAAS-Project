import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getPublishedSite, recordSiteView } from "@/features/websites/live";
import { liveSitePath } from "@/features/websites/urls";
import { findPage, SiteRenderer } from "@/themes/renderer";
import { siteFontClassName } from "@/themes/shared/fonts";

type Params = { slug: string; page?: string[] };

const slugSchema = z.string().regex(/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])$/);
const pageSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80);

// Rendered per request so a publish or unpublish shows at once, and each view counts.
export const dynamic = "force-dynamic";

async function load({ slug, page: path }: Params) {
  if (!slugSchema.safeParse(slug).success || (path && (path.length > 1 || !pageSchema.safeParse(path[0]).success))) return null;
  const site = await getPublishedSite(slug);
  if (!site) return null;
  const page = findPage(site.document, path?.[0]);
  return page ? { site, page } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const loaded = await load(await params);
  if (!loaded) return { title: "Website not found" };
  const { site, page } = loaded;
  const siteName = site.document.siteName;
  return {
    title: { absolute: page.isHome ? siteName : `${page.title} | ${siteName}` },
    openGraph: { title: siteName, siteName },
  };
}

// A published website, served from its immutable published version.
export default async function LiveSitePage({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  const loaded = await load(resolved);
  if (!loaded) notFound();

  await recordSiteView(resolved.slug, loaded.page.isHome ? "" : loaded.page.slug);

  return <SiteRenderer document={loaded.site.document} page={loaded.page} basePath={liveSitePath(resolved.slug)} className={siteFontClassName} />;
}
