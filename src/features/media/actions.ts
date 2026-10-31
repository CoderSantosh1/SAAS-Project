"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { mediaRecordSchema, type MediaRecordValues } from "./schemas";

type ActionResult = { error?: string; message?: string };

export async function recordMediaAsset(values: MediaRecordValues): Promise<ActionResult> {
  const profile = await requireUser();
  const parsed = mediaRecordSchema.safeParse(values);
  if (!parsed.success || !parsed.data.path.startsWith(`${profile.id}/`)) {
    return { error: "We could not save that image. Please try again." };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("media_assets").insert({
    scope: "user",
    owner_id: profile.id,
    bucket: "user-media",
    path: input.path,
    file_name: input.fileName,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    width: input.width ?? null,
    height: input.height ?? null,
  });
  if (error) return { error: "We could not save that image. Please try again." };

  revalidatePath("/dashboard/media");
  return {};
}

export async function deleteMediaAsset(id: string): Promise<ActionResult> {
  const profile = await requireUser();
  if (!z.uuid().safeParse(id).success) return { error: "Image not found." };

  const supabase = await createClient();
  const { data: asset } = await supabase
    .from("media_assets")
    .select("path")
    .eq("id", id)
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (!asset) return { error: "Image not found." };

  // The file goes first. If that fails, the record stays and the user can try again.
  const { error: storageError } = await supabase.storage.from("user-media").remove([asset.path]);
  if (storageError) return { error: "We could not delete that image. Please try again." };

  const { error } = await supabase.from("media_assets").delete().eq("id", id).eq("owner_id", profile.id);
  if (error) return { error: "We could not delete that image. Please try again." };

  revalidatePath("/dashboard/media");
  return { message: "Image deleted." };
}
