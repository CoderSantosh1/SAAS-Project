"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { hostnameSchema } from "./hostnames";

export type DomainResult = { error?: string; message?: string };

const id = z.uuid();

export async function addDomain(websiteId: string, hostname: string): Promise<DomainResult> {
  await requireUser();
  const host = hostnameSchema.safeParse(hostname);
  if (!id.safeParse(websiteId).success) return { error: "Choose a website." };
  if (!host.success) return { error: host.error.issues[0]?.message ?? "Enter a valid domain." };

  const supabase = await createClient();
  const { error } = await supabase.from("website_domains").insert({ website_id: websiteId, hostname: host.data });
  if (error) {
    if (error.code === "23505") return { error: "That domain is already connected to a website." };
    if (error.code === "WD001") return { error: error.message };
    return { error: "We could not add this domain. Please try again." };
  }

  revalidatePath("/dashboard/domains");
  return { message: `${host.data} was added. Now add the DNS records below.` };
}

export async function removeDomain(domainId: string): Promise<DomainResult> {
  await requireUser();
  if (!id.safeParse(domainId).success) return { error: "Please try again." };

  const supabase = await createClient();
  const { error, count } = await supabase.from("website_domains").delete({ count: "exact" }).eq("id", domainId);
  if (error || count === 0) return { error: "We could not remove this domain. Please try again." };

  revalidatePath("/dashboard/domains");
  return { message: "Domain removed." };
}
