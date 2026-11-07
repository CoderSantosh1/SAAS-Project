import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MyAnalytics = {
  days: number;
  total: number;
  previous_total: number;
  daily: { day: string; views: number }[];
  pages: { page_slug: string; views: number }[];
  websites: { id: string; name: string; slug: string; status: string; views: number }[];
};

// The signed-in user's visits, for all their websites or one of them. Returns null
// for a website that is not theirs.
export async function getMyAnalytics(days: number, websiteId?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_analytics", { p_days: days, p_website_id: websiteId ?? null });
  if (error) {
    if (error.code === "P0002") return null;
    throw new Error(`Could not load analytics: ${error.message}`);
  }
  return data as MyAnalytics;
}
