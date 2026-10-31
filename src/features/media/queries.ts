import "server-only";
import { createClient } from "@/lib/supabase/server";

export type MediaAsset = {
  id: string;
  path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
  url: string;
};

export async function listMyMedia(ownerId: string, search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("media_assets")
    .select("id, path, file_name, mime_type, size_bytes, width, height, created_at")
    .eq("owner_id", ownerId)
    .eq("scope", "user")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    // Escapes the characters ilike treats as wildcards, so the search is plain text.
    query = query.ilike("file_name", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load media: ${error.message}`);

  return (data ?? []).map((asset) => ({
    ...asset,
    url: supabase.storage.from("user-media").getPublicUrl(asset.path).data.publicUrl,
  })) as MediaAsset[];
}
