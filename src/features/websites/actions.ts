"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  createWebsiteSchema,
  slugify,
  subdomainSchema,
  websiteBasicsSchema,
  type CreateWebsiteValues,
  type WebsiteBasicsValues,
} from "./schemas";

export type ActionResult = { error?: string; message?: string };

const INVALID_INPUT = "Please check the details you entered.";
const websiteId = z.uuid();

function writeError(error: { code?: string }, fallback: string) {
  if (error.code === "23505") return "That web address is already taken. Please choose another.";
  if (error.code === "23514") return "That web address is not allowed. Please choose another.";
  return fallback;
}

export async function checkSubdomain(slug: string) {
  await requireUser();
  if (!subdomainSchema.safeParse(slug).success) return false;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_subdomain_available", { p_slug: slug });
  return !error && data === true;
}

export async function createWebsite(values: CreateWebsiteValues): Promise<ActionResult> {
  await requireUser();
  const parsed = createWebsiteSchema.safeParse(values);
  if (!parsed.success) return { error: INVALID_INPUT };
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_website", {
    p_theme_slug: input.themeSlug,
    p_name: input.name,
    p_slug: input.slug,
    p_category_slug: input.categorySlug ?? null,
    p_business_name: input.businessName ?? null,
    p_description: input.description ?? null,
    p_design: { primary: input.primaryColor ?? null, logoUrl: input.logoUrl ?? null },
    p_contact: {
      email: input.email || null,
      phone: input.phone || null,
      address: input.address ?? null,
    },
  });

  if (error) {
    if (error.code === "P0002") return { error: "This theme is no longer available." };
    return { error: writeError(error, "We could not create your website. Please try again.") };
  }

  revalidatePath("/dashboard", "layout");
  // Goes straight to the editor once it exists.
  redirect("/dashboard/websites?created=1");
}

export async function updateWebsite(id: string, values: WebsiteBasicsValues): Promise<ActionResult> {
  const profile = await requireUser();
  const parsed = websiteBasicsSchema.safeParse(values);
  if (!parsed.success || !websiteId.safeParse(id).success) return { error: INVALID_INPUT };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("websites")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      business_name: parsed.data.businessName ?? null,
      description: parsed.data.description ?? null,
    })
    .eq("id", id)
    .eq("owner_id", profile.id)
    .select("id");

  if (error) return { error: writeError(error, "We could not save your changes. Please try again.") };
  if (!data?.length) return { error: "Website not found." };

  revalidatePath("/dashboard", "layout");
  return { message: "Changes saved." };
}

export async function duplicateWebsite(id: string): Promise<ActionResult> {
  const profile = await requireUser();
  if (!websiteId.safeParse(id).success) return { error: INVALID_INPUT };

  const supabase = await createClient();
  const { data: source } = await supabase
    .from("websites")
    .select("name, slug")
    .eq("id", id)
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (!source) return { error: "Website not found." };

  const suffix = crypto.randomUUID().slice(0, 6);
  const { error } = await supabase.rpc("duplicate_website", {
    p_website_id: id,
    p_name: `${source.name} copy`.slice(0, 120),
    p_slug: `${slugify(source.slug).slice(0, 50)}-${suffix}`,
  });
  if (error) return { error: "We could not copy this website. Please try again." };

  revalidatePath("/dashboard", "layout");
  return { message: "Website copied." };
}

export async function deleteWebsite(id: string): Promise<ActionResult> {
  const profile = await requireUser();
  if (!websiteId.safeParse(id).success) return { error: INVALID_INPUT };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("websites")
    .delete()
    .eq("id", id)
    .eq("owner_id", profile.id)
    .select("id");

  if (error) return { error: "We could not delete this website. Please try again." };
  if (!data?.length) return { error: "Website not found." };

  revalidatePath("/dashboard", "layout");
  return { message: "Website deleted." };
}
