import "server-only";
import { createClient } from "@/lib/supabase/server";
import { buildDraftDocument, type WebsiteDraft } from "./document";

export type RecentWebsite = {
  id: string;
  name: string;
  slug: string;
  status: string;
  updated_at: string;
};

export type MyWebsite = RecentWebsite & {
  category_name: string | null;
  theme_name: string | null;
};

export type WebsiteDetails = {
  id: string;
  name: string;
  slug: string;
  status: string;
  business_name: string | null;
  description: string | null;
};

// RLS limits these queries to the signed-in user's websites.
export async function getUserDashboardData(userId: string) {
  const supabase = await createClient();

  const countByStatus = (status?: "published" | "draft") => {
    const query = supabase
      .from("websites")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);
    return status ? query.eq("status", status) : query;
  };

  const [total, published, draft, recent] = await Promise.all([
    countByStatus(),
    countByStatus("published"),
    countByStatus("draft"),
    supabase
      .from("websites")
      .select("id, name, slug, status, updated_at")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const error = total.error ?? published.error ?? draft.error ?? recent.error;
  if (error) throw new Error(`Could not load dashboard: ${error.message}`);

  return {
    total: total.count ?? 0,
    published: published.count ?? 0,
    draft: draft.count ?? 0,
    recent: (recent.data ?? []) as RecentWebsite[],
  };
}

export async function listMyWebsites() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_my_websites");
  if (error) throw new Error(`Could not load websites: ${error.message}`);
  return (data ?? []) as MyWebsite[];
}

export async function getMyWebsite(id: string, ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("websites")
    .select("id, name, slug, status, business_name, description")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error) throw new Error(`Could not load website: ${error.message}`);
  return data as WebsiteDetails | null;
}

export async function getDraftDocument(websiteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_website_draft", { p_website_id: websiteId });
  if (error) throw new Error(`Could not load website draft: ${error.message}`);
  return data ? buildDraftDocument(data as WebsiteDraft) : null;
}

export async function listPopularThemeSlugs(limit = 3) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_popular_themes", { p_limit: limit });
  if (error) throw new Error(`Could not load popular themes: ${error.message}`);
  return ((data ?? []) as { theme_slug: string }[]).map((row) => row.theme_slug);
}
