import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MyDomain = { id: string; hostname: string; status: string; ssl_status: string; verification_token: string; verified_at: string | null; created_at: string };
export type DomainWebsite = { id: string; name: string; slug: string; status: string; website_domains: MyDomain[] };

// The signed-in user's websites with their custom domains. RLS limits it to them.
export async function listMyDomains(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("websites")
    .select("id, name, slug, status, website_domains(id, hostname, status, ssl_status, verification_token, verified_at, created_at)")
    .eq("owner_id", ownerId)
    .order("name");
  if (error) throw new Error(`Could not load domains: ${error.message}`);
  return (data ?? []) as DomainWebsite[];
}
