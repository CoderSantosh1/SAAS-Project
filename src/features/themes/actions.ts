"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { PUBLIC_DATA_TAG } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { getTheme } from "@/themes/registry";
import { buildSectionRows } from "@/themes/section-rows";
import { MAX_PACKAGE_BYTES, parseThemePackage, type ThemePackage } from "./package";
import { packagePathSchema, themeDetailsSchema, versionNumberSchema, type ThemeDetailsValues } from "./schemas";

export type ThemeActionResult = { error?: string; errors?: string[]; message?: string };

const themeId = z.uuid();
const STATUSES = ["draft", "under_review", "published", "unpublished", "archived"] as const;

function themePayload(values: z.output<typeof themeDetailsSchema>) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description,
    category_id: values.categoryId,
    is_premium: values.isPremium,
    is_featured: values.isFeatured,
    author_name: values.authorName,
    author_url: values.authorUrl,
    supported_features: values.supportedFeatures,
    thumbnail_url: values.thumbnailUrl,
    desktop_preview_url: values.desktopPreviewUrl,
    mobile_preview_url: values.mobilePreviewUrl,
    preview_url: values.previewUrl,
  };
}

function friendlyError(error: { code?: string; message?: string }, fallback: string) {
  if (error.code === "23505") return "That slug or version number is already in use.";
  // The theme functions raise these with messages written for admins.
  if (error.code?.startsWith("WT") || error.code === "42501") return error.message ?? fallback;
  return fallback;
}

function versionPayload(pkg: ThemePackage, version: string, packagePath: string, changelog?: string) {
  // The validator already confirmed this component is registered.
  const theme = getTheme(pkg.componentId, pkg.componentVersion)!;
  return {
    version,
    component_id: pkg.componentId,
    component_version: pkg.componentVersion,
    package_path: packagePath,
    changelog: changelog || null,
    design_tokens: pkg.tokens,
    compatibility: { minDocumentVersion: 1 },
    default_config: { pages: pkg.pages },
    sections: buildSectionRows(theme, pkg.pages),
  };
}

// The browser has already put the ZIP in the private bucket, because server actions have
// a small body limit. This validates it, and stores its images only if all of it passes.
async function processPackage(packagePath: string) {
  const supabase = await createClient();

  const { data: blob, error: downloadError } = await supabase.storage.from("theme-packages").download(packagePath);
  if (downloadError || !blob) {
    return { errors: ["We could not read the uploaded package. Please upload it again."] };
  }
  if (blob.size > MAX_PACKAGE_BYTES) {
    await supabase.storage.from("theme-packages").remove([packagePath]);
    return { errors: ["The package is larger than 25 MB."] };
  }

  const folder = `themes/${crypto.randomUUID()}`;
  const assetUrl = (name: string) =>
    supabase.storage.from("platform-media").getPublicUrl(`${folder}/${name}`).data.publicUrl;

  const result = parseThemePackage(new Uint8Array(await blob.arrayBuffer()), assetUrl);
  if (!result.ok) {
    await supabase.storage.from("theme-packages").remove([packagePath]);
    return { errors: result.errors };
  }

  const stored: string[] = [];
  const cleanup = async () => {
    await supabase.storage.from("theme-packages").remove([packagePath]);
    if (stored.length > 0) await supabase.storage.from("platform-media").remove(stored);
  };

  for (const asset of result.value.assets) {
    const path = `${folder}/${asset.name}`;
    const { error } = await supabase.storage
      .from("platform-media")
      .upload(path, asset.bytes, { contentType: asset.mime, cacheControl: "31536000" });
    if (error) {
      await cleanup();
      return { errors: [`We could not store ${asset.name}. Please try again.`] };
    }
    stored.push(path);
  }

  return { pkg: result.value, cleanup };
}

export async function registerThemeUpload(input: {
  packagePath: string;
  version: string;
  details: ThemeDetailsValues;
}): Promise<ThemeActionResult> {
  await requireAdmin("themes.manage");

  const path = packagePathSchema.safeParse(input.packagePath);
  const version = versionNumberSchema.safeParse(input.version);
  const details = themeDetailsSchema.safeParse(input.details);
  if (!path.success || !version.success || !details.success) {
    return { error: "Please check the details you entered." };
  }

  const processed = await processPackage(path.data);
  if (!processed.pkg) return { errors: processed.errors };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_theme", {
    p_theme: themePayload(details.data),
    p_version: versionPayload(processed.pkg, version.data, path.data),
  });

  if (error) {
    await processed.cleanup();
    return { error: friendlyError(error, "We could not register this theme. Please try again.") };
  }

  revalidatePath("/admin/themes");
  redirect(`/admin/themes/${data as string}?uploaded=1`);
}

export async function uploadThemeVersion(input: {
  themeId: string;
  packagePath: string;
  version: string;
  changelog?: string;
}): Promise<ThemeActionResult> {
  await requireAdmin("themes.manage");

  const path = packagePathSchema.safeParse(input.packagePath);
  const version = versionNumberSchema.safeParse(input.version);
  if (!path.success || !version.success || !themeId.safeParse(input.themeId).success) {
    return { error: "Please check the details you entered." };
  }

  const processed = await processPackage(path.data);
  if (!processed.pkg) return { errors: processed.errors };

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_theme_version", {
    p_theme_id: input.themeId,
    p_version: versionPayload(processed.pkg, version.data, path.data, input.changelog?.trim().slice(0, 500)),
  });

  if (error) {
    await processed.cleanup();
    return { error: friendlyError(error, "We could not add this version. Please try again.") };
  }

  revalidatePath(`/admin/themes/${input.themeId}`);
  return { message: `Version ${version.data} uploaded. Review it, then activate it when ready.` };
}

export async function updateThemeDetails(id: string, values: ThemeDetailsValues): Promise<ThemeActionResult> {
  await requireAdmin("themes.manage");
  const details = themeDetailsSchema.safeParse(values);
  if (!details.success || !themeId.safeParse(id).success) return { error: "Please check the details you entered." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_theme", { p_theme_id: id, p_theme: themePayload(details.data) });
  if (error) return { error: friendlyError(error, "We could not save this theme. Please try again.") };

  updateTag(PUBLIC_DATA_TAG);
  revalidatePath("/admin/themes", "layout");
  return { message: "Theme saved." };
}

export async function setThemeStatus(id: string, status: (typeof STATUSES)[number]): Promise<ThemeActionResult> {
  await requireAdmin("themes.manage");
  if (!themeId.safeParse(id).success || !STATUSES.includes(status)) return { error: "Please try again." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_theme_status", { p_theme_id: id, p_status: status });
  if (error) return { error: friendlyError(error, "We could not change this theme's status. Please try again.") };

  updateTag(PUBLIC_DATA_TAG);
  revalidatePath("/admin/themes", "layout");
  return {};
}

export async function activateVersion(id: string, versionId: string): Promise<ThemeActionResult> {
  await requireAdmin("themes.manage");
  if (!themeId.safeParse(id).success || !themeId.safeParse(versionId).success) return { error: "Please try again." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("activate_theme_version", { p_theme_id: id, p_version_id: versionId });
  if (error) return { error: friendlyError(error, "We could not activate this version. Please try again.") };

  updateTag(PUBLIC_DATA_TAG);
  revalidatePath("/admin/themes", "layout");
  return {};
}

export async function duplicateTheme(id: string): Promise<ThemeActionResult> {
  await requireAdmin("themes.manage");
  if (!themeId.safeParse(id).success) return { error: "Please try again." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("duplicate_theme_metadata", { p_theme_id: id });
  if (error) return { error: friendlyError(error, "We could not copy this theme. Please try again.") };

  revalidatePath("/admin/themes");
  redirect(`/admin/themes/${data as string}`);
}

export async function deleteTheme(id: string): Promise<ThemeActionResult> {
  await requireAdmin("themes.manage");
  if (!themeId.safeParse(id).success) return { error: "Please try again." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_theme", { p_theme_id: id });
  if (error) return { error: friendlyError(error, "We could not delete this theme. Please try again.") };

  updateTag(PUBLIC_DATA_TAG);
  revalidatePath("/admin/themes");
  redirect("/admin/themes");
}
