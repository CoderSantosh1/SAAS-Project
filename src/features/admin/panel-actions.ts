"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { resolveTxt } from "node:dns/promises";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import type { Permission } from "@/lib/permissions";
import { PUBLIC_DATA_TAG } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

export type FormResult = { error?: string; message?: string };

const uuid = z.uuid();
const slug = z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens.").max(80);
const text = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Enter a full address starting with https://")
  .transform((value) => value || null);
const order = z.coerce.number().int().min(0).max(1_000_000);
const flag = (form: FormData, name: string) => form.get(name) === "on";
const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

function failure(error: { code?: string; message?: string }, fallback: string): FormResult {
  if (error.code === "23505") return { error: "That slug is already in use." };
  // These codes carry messages written for admins by the database functions.
  if (error.code?.startsWith("WA") || error.code === "42501" || error.code === "P0002") {
    return { error: error.message ?? fallback };
  }
  return { error: fallback };
}

function firstIssue(error: z.ZodError) {
  const issue = error.issues[0];
  return { error: issue ? `${issue.path.join(".") || "Form"}: ${issue.message}` : "Please check your details." };
}

// Runs one admin database function, after checking the permission here as well.
async function run(permission: Permission, name: string, args: Record<string, unknown>, paths: string[], fallback: string) {
  await requireAdmin(permission);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, args);
  if (error) return { result: failure(error, fallback), data: null };
  for (const path of paths) revalidatePath(path, "layout");
  return { result: {} as FormResult, data };
}

// ---------------------------------------------------------------- Users
export async function setUserStatus(id: string, status: "active" | "suspended", _: FormResult, form: FormData) {
  if (!uuid.safeParse(id).success) return { error: "User not found." };
  const reason = field(form, "reason").trim().slice(0, 500) || null;
  const { result } = await run("users.manage", "admin_set_user_status", { p_user_id: id, p_status: status, p_reason: reason }, ["/admin/users"], "We could not update this user.");
  return result.error ? result : { message: status === "suspended" ? "Account suspended." : "Account restored." };
}

// Moves a user to a plan, for example after they request one and pay offline.
export async function setUserPlan(id: string, _: FormResult, form: FormData) {
  if (!uuid.safeParse(id).success) return { error: "User not found." };
  const plan = slug.safeParse(field(form, "plan"));
  const months = z.coerce.number().int().min(1).max(36).safeParse(field(form, "months") || "1");
  if (!plan.success || !months.success) return { error: "Choose a plan and a period of 1 to 36 months." };
  const { result } = await run("plans.manage", "admin_set_user_plan", { p_user_id: id, p_plan_slug: plan.data, p_months: months.data }, ["/admin/users"], "We could not change this plan.");
  return result.error ? result : { message: "Plan updated. Any open plan request was marked resolved." };
}

export async function setUserRoles(id: string, _: FormResult, form: FormData) {
  const { access } = await requireAdmin("users.view");
  if (!access.isSuper) return { error: "Only a Super Admin can assign roles." };
  if (!uuid.safeParse(id).success) return { error: "User not found." };
  const roles = form.getAll("roles").filter((role): role is string => typeof role === "string");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_user_roles", { p_user_id: id, p_role_slugs: roles });
  if (error) return failure(error, "We could not update roles.");
  revalidatePath("/admin/users", "layout");
  return { message: "Roles saved." };
}

// ---------------------------------------------------------------- Categories
const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(120),
  slug,
  description: text(500),
  icon: z.string().trim().regex(/^[a-z0-9-]*$/, "Use a Lucide icon name, like coffee").max(40).transform((value) => value || null),
  thumbnail_url: httpUrl,
  status: z.enum(["draft", "published", "archived"]),
  display_order: order,
});

export async function saveCategory(id: string | null, _: FormResult, form: FormData): Promise<FormResult> {
  await requireAdmin("categories.manage");
  const parsed = categorySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return firstIssue(parsed.error);
  const { result } = await run("categories.manage", "admin_save_category", { p_id: id, p_data: { ...parsed.data, is_featured: flag(form, "is_featured") } }, ["/admin/categories"], "We could not save this category.");
  if (result.error) return result;
  updateTag(PUBLIC_DATA_TAG);
  redirect("/admin/categories");
}

export async function deleteCategory(id: string): Promise<FormResult> {
  const { result } = await run("categories.manage", "admin_delete_category", { p_id: id }, ["/admin/categories"], "We could not delete this category.");
  if (!result.error) updateTag(PUBLIC_DATA_TAG);
  return result;
}

// ---------------------------------------------------------------- Templates
const templateSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(120),
  slug,
  description: text(500),
  theme_id: z.uuid("Choose a theme"),
  status: z.enum(["draft", "published", "archived"]),
  display_order: order,
});

export async function saveTemplate(id: string | null, _: FormResult, form: FormData): Promise<FormResult> {
  await requireAdmin("templates.manage");
  const parsed = templateSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return firstIssue(parsed.error);

  const categories = z.array(z.uuid()).safeParse(form.getAll("categories"));
  const images = z
    .array(z.string().regex(/^https?:\/\/\S+$/i))
    .max(10)
    .safeParse(field(form, "preview_images").split("\n").map((line) => line.trim()).filter(Boolean));
  if (!categories.success) return { error: "Please check the categories." };
  if (!images.success) return { error: "Preview images must be full https:// addresses, one on each line (10 at most)." };

  const { result } = await run(
    "templates.manage",
    "admin_save_template",
    {
      p_id: id,
      p_data: { ...parsed.data, preview_images: images.data, is_featured: flag(form, "is_featured"), is_visible: flag(form, "is_visible") },
      p_category_ids: categories.data,
    },
    ["/admin/templates"],
    "We could not save this template.",
  );
  if (result.error) return result;
  updateTag(PUBLIC_DATA_TAG);
  redirect("/admin/templates");
}

export async function deleteTemplate(id: string): Promise<FormResult> {
  const { result } = await run("templates.manage", "admin_delete_template", { p_id: id }, ["/admin/templates"], "We could not delete this template.");
  if (!result.error) updateTag(PUBLIC_DATA_TAG);
  return result;
}

// ---------------------------------------------------------------- Websites
export async function setWebsiteSuspended(id: string, suspended: boolean, _: FormResult, form: FormData) {
  if (!uuid.safeParse(id).success) return { error: "Website not found." };
  const reason = field(form, "reason").trim().slice(0, 500) || null;
  const { result } = await run("websites.moderate", "admin_set_website_suspended", { p_id: id, p_suspended: suspended, p_reason: reason }, ["/admin/websites", "/admin/published-websites"], "We could not update this website.");
  return result.error ? result : { message: suspended ? "Website suspended." : "Website restored." };
}

// ---------------------------------------------------------------- Media
const mediaSchema = z.object({
  path: z.string().regex(/^library\/[0-9a-f-]{36}\.[a-z]+$/),
  file_name: z.string().trim().min(1).max(255),
  mime_type: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif", "image/x-icon"]),
  size_bytes: z.number().int().positive().max(10 * 1024 * 1024),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});

export async function recordPlatformMedia(values: unknown): Promise<FormResult> {
  const parsed = mediaSchema.safeParse(values);
  if (!parsed.success) return { error: "We could not save that file." };
  const { result } = await run("media.manage", "admin_add_media", { p_data: parsed.data }, ["/admin/media"], "We could not save that file.");
  return result;
}

export async function deletePlatformMedia(id: string): Promise<FormResult> {
  await requireAdmin("media.manage");
  if (!uuid.safeParse(id).success) return { error: "File not found." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_delete_media", { p_id: id });
  if (error) return failure(error, "We could not delete that file.");
  await supabase.storage.from("platform-media").remove([data as string]);
  revalidatePath("/admin/media");
  return { message: "File deleted." };
}

// ---------------------------------------------------------------- Domains
export async function verifyDomain(id: string, hostname: string, token: string): Promise<FormResult> {
  await requireAdmin("domains.manage");
  if (!uuid.safeParse(id).success || !/^[a-z0-9.-]+$/.test(hostname)) return { error: "Domain not found." };

  let records: string[][] = [];
  try {
    records = await resolveTxt(`_web-verify.${hostname}`);
  } catch {
    records = [];
  }
  const verified = records.some((parts) => parts.join("") === token);

  const { result } = await run("domains.manage", "admin_set_domain_status", { p_id: id, p_status: verified ? "verified" : "failed" }, ["/admin/domains"], "We could not update this domain.");
  if (result.error) return result;
  return verified
    ? { message: `${hostname} ownership is verified.` }
    : { error: `The TXT record was not found at _web-verify.${hostname}. DNS changes can take a while to appear.` };
}

export async function setDomainSuspended(id: string, suspended: boolean): Promise<FormResult> {
  const { result } = await run("domains.manage", "admin_set_domain_status", { p_id: id, p_status: suspended ? "suspended" : "pending" }, ["/admin/domains"], "We could not update this domain.");
  return result;
}

// ---------------------------------------------------------------- Plans
const optionalLimit = z.string().trim().transform((value, context) => {
  if (value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 10_000_000) {
    context.addIssue({ code: "custom", message: "Enter a whole number, or leave it empty for no limit." });
    return z.NEVER;
  }
  return number;
});

const planSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(60),
  slug,
  price_rupees: z.coerce.number().min(0).max(1_000_000),
  website_limit: optionalLimit,
  storage_limit_mb: optionalLimit,
});

export async function savePlan(id: string | null, _: FormResult, form: FormData): Promise<FormResult> {
  await requireAdmin("plans.manage");
  const parsed = planSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return firstIssue(parsed.error);
  const { price_rupees, ...rest } = parsed.data;
  const features = field(form, "features").split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 30);

  const { result } = await run(
    "plans.manage",
    "admin_save_plan",
    {
      p_id: id,
      p_data: {
        ...rest,
        monthly_price_paise: Math.round(price_rupees * 100),
        features,
        custom_domains: flag(form, "custom_domains"),
        premium_themes: flag(form, "premium_themes"),
        is_active: flag(form, "is_active"),
      },
    },
    ["/admin/plans"],
    "We could not save this plan.",
  );
  if (result.error) return result;
  updateTag(PUBLIC_DATA_TAG);
  return { message: "Plan saved." };
}

// ---------------------------------------------------------------- Support
const ticketSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  admin_response: text(5000),
});

export async function updateTicket(id: string, _: FormResult, form: FormData): Promise<FormResult> {
  await requireAdmin("support.manage");
  const parsed = ticketSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success || !uuid.safeParse(id).success) return { error: "Please check your details." };
  const { result } = await run(
    "support.manage",
    "admin_update_ticket",
    { p_id: id, p_status: parsed.data.status, p_priority: parsed.data.priority, p_response: parsed.data.admin_response },
    ["/admin/support"],
    "We could not update this ticket.",
  );
  return result.error ? result : { message: "Ticket updated." };
}

// ---------------------------------------------------------------- Settings
const settingsSchema = z.object({
  name: z.string().trim().min(1, "Enter a platform name").max(60),
  logo_url: httpUrl,
  favicon_url: httpUrl,
  seo_title: z.string().trim().max(120),
  seo_description: z.string().trim().max(300),
  contact_email: z.union([z.literal(""), z.email("Enter a valid email")]),
  contact_phone: z.string().trim().max(30),
  facebook: httpUrl,
  instagram: httpUrl,
  x: httpUrl,
  linkedin: httpUrl,
});

export async function saveSettings(_: FormResult, form: FormData): Promise<FormResult> {
  await requireAdmin("settings.manage");
  const parsed = settingsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return firstIssue(parsed.error);
  const value = parsed.data;

  const { result } = await run(
    "settings.manage",
    "admin_save_settings",
    {
      p_settings: {
        "platform.name": value.name,
        "platform.logo_url": value.logo_url ?? "",
        "platform.favicon_url": value.favicon_url ?? "",
        "seo.title": value.seo_title,
        "seo.description": value.seo_description,
        "contact.email": value.contact_email,
        "contact.phone": value.contact_phone,
        "social.facebook": value.facebook ?? "",
        "social.instagram": value.instagram ?? "",
        "social.x": value.x ?? "",
        "social.linkedin": value.linkedin ?? "",
        "feature.registrations_open": flag(form, "registrations_open"),
        "platform.maintenance_mode": flag(form, "maintenance_mode"),
      },
    },
    ["/"],
    "We could not save the settings.",
  );
  if (result.error) return result;
  updateTag(PUBLIC_DATA_TAG);
  return { message: "Settings saved." };
}

// ---------------------------------------------------------------- Theme code access
export async function grantThemeCode(themeId: string, _: FormResult, form: FormData) {
  if (!uuid.safeParse(themeId).success) return { error: "Theme not found." };
  const email = z.email().safeParse(field(form, "email").trim());
  if (!email.success) return { error: "Enter the customer's email address." };
  const days = field(form, "days");
  const expires = days && days !== "never" ? new Date(Date.now() + Number(days) * 86_400_000).toISOString() : null;
  const note = field(form, "note").trim().slice(0, 300) || null;
  const { result } = await run(
    "themes.download_code",
    "admin_grant_theme_code",
    { p_theme_id: themeId, p_email: email.data, p_note: note, p_expires_at: expires },
    [`/admin/themes/${themeId}`],
    "We could not give access.",
  );
  return result.error ? result : { message: `${email.data} can now download this theme's code.` };
}

export async function revokeThemeCode(themeId: string, grantId: string) {
  if (!uuid.safeParse(grantId).success) return { error: "Access not found." };
  const { result } = await run("themes.download_code", "admin_revoke_theme_code", { p_grant_id: grantId }, [`/admin/themes/${themeId}`], "We could not remove access.");
  return result.error ? result : { message: "Access removed." };
}
