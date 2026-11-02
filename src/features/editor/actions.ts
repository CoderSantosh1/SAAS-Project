"use server";

import { z } from "zod";
import { listMyMedia, type MediaAsset } from "@/features/media/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { editorDocumentSchema, type EditorDocument, type VersionSummary } from "./types";

export type SaveResult =
  | { status: "saved"; revision: number }
  | { status: "conflict" | "signed-out" }
  | { status: "error"; message: string };

const websiteId = z.uuid();

// These return a result rather than redirecting, because a redirect would throw away
// the unsaved work on the user's screen.
async function activeProfile() {
  const profile = await getCurrentProfile();
  return profile?.account_status === "active" ? profile : null;
}

export async function saveDraft(id: string, revision: number, document: EditorDocument): Promise<SaveResult> {
  if (!(await activeProfile())) return { status: "signed-out" };

  const parsed = editorDocumentSchema.safeParse(document);
  if (!parsed.success || !websiteId.safeParse(id).success || !Number.isInteger(revision)) {
    return { status: "error", message: "Some of your changes are not valid." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_website_draft", {
    p_website_id: id,
    p_expected_revision: revision,
    p_document: parsed.data,
  });

  if (error) {
    if (error.code === "WV001") return { status: "conflict" };
    if (error.code === "23505") return { status: "error", message: "Two pages have the same address." };
    return { status: "error", message: "We could not save your changes." };
  }
  return { status: "saved", revision: data as number };
}

export async function createCheckpoint(id: string, label: string) {
  if (!(await activeProfile()) || !websiteId.safeParse(id).success) {
    return { error: "We could not save this version." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_website_checkpoint", {
    p_website_id: id,
    p_label: label.trim().slice(0, 80) || null,
  });
  return error ? { error: "We could not save this version." } : {};
}

export async function listCheckpoints(id: string): Promise<VersionSummary[]> {
  if (!(await activeProfile()) || !websiteId.safeParse(id).success) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("website_versions")
    .select("id, version_number, label, created_at")
    .eq("website_id", id)
    .eq("kind", "checkpoint")
    .order("version_number", { ascending: false })
    .limit(50);
  if (error) throw new Error("Could not load versions");
  return (data ?? []) as VersionSummary[];
}

export async function getCheckpoint(websiteIdValue: string, versionId: string): Promise<EditorDocument | null> {
  if (
    !(await activeProfile()) ||
    !websiteId.safeParse(websiteIdValue).success ||
    !websiteId.safeParse(versionId).success
  ) {
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("website_versions")
    .select("snapshot")
    .eq("id", versionId)
    .eq("website_id", websiteIdValue)
    .eq("kind", "checkpoint")
    .maybeSingle();
  const parsed = editorDocumentSchema.safeParse(data?.snapshot);
  return parsed.success ? parsed.data : null;
}

export async function listMediaForPicker(): Promise<MediaAsset[]> {
  const profile = await activeProfile();
  return profile ? listMyMedia(profile.id) : [];
}
