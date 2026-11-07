import "server-only";
import { createPublicClient, createUncachedPublicClient } from "@/lib/supabase/public";
import { buildDraftDocument, type WebsiteDraft } from "./document";

type PublishedSite = { id: string; name: string; slug: string; published_at: string; version: number; snapshot: WebsiteDraft };

// The published version of a website, or null when it is not live. Visitors read it
// through get_published_site only, so drafts and owner details never reach them.
export async function getPublishedSite(slug: string) {
  const { data, error } = await createPublicClient().rpc("get_published_site", { site_slug: slug });
  if (error) throw new Error(`Could not load website: ${error.message}`);
  const site = data as PublishedSite | null;
  if (!site?.snapshot) return null;
  const document = buildDraftDocument(site.snapshot);
  return document ? { ...site, document } : null;
}

// Counts a page view. Analytics must never break a page, so failures are only logged.
export async function recordSiteView(slug: string, page = "") {
  try {
    const { error } = await createUncachedPublicClient().rpc("record_site_view", { p_site_slug: slug, p_page_slug: page });
    if (error) console.error(`Could not record view: ${error.message}`);
  } catch (error) {
    console.error(error);
  }
}
