"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { PUBLIC_DATA_TAG } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

export type PublishResult = { error?: string; message?: string; version?: number };

const websiteId = z.uuid();

function publishError(error: { code?: string; message?: string }, fallback: string) {
  // The publishing functions raise these with messages written for owners.
  if (error.code?.startsWith("WP")) return error.message ?? fallback;
  if (error.code === "P0002") return "We could not find this website.";
  return fallback;
}

function refresh() {
  updateTag(PUBLIC_DATA_TAG);
  revalidatePath("/dashboard", "layout");
}

export async function publishWebsite(id: string): Promise<PublishResult> {
  await requireUser();
  if (!websiteId.safeParse(id).success) return { error: "Please try again." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_website", { p_website_id: id });
  if (error) return { error: publishError(error, "We could not publish your website. Please try again.") };

  refresh();
  const version = (data as { version: number }).version;
  return { message: version === 1 ? "Your website is live!" : "Your changes are live.", version };
}

export async function unpublishWebsite(id: string): Promise<PublishResult> {
  await requireUser();
  if (!websiteId.safeParse(id).success) return { error: "Please try again." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("unpublish_website", { p_website_id: id });
  if (error) return { error: publishError(error, "We could not take your website offline. Please try again.") };

  refresh();
  return { message: "Your website is offline." };
}
