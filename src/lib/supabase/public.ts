import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

const REVALIDATE_SECONDS = 60;

// For public pages. Reads as a visitor, carries no session, and briefly caches
// responses so marketing traffic does not hit the database on every request.
export function createPublicClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: REVALIDATE_SECONDS } }),
    },
  });
}
