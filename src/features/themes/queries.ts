import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getThemePreviewDocument } from "./preview";

export type AdminThemeRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_premium: boolean;
  is_featured: boolean;
  thumbnail_url: string | null;
  updated_at: string;
  category_name: string | null;
  current_version: string | null;
};

export type AdminThemeVersion = {
  id: string;
  version: string;
  component_id: string;
  component_version: string;
  status: string;
  changelog: string | null;
  created_at: string;
  website_count: number;
};

export type AdminTheme = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  status: string;
  is_premium: boolean;
  is_featured: boolean;
  author_name: string | null;
  author_url: string | null;
  supported_features: string[];
  thumbnail_url: string | null;
  desktop_preview_url: string | null;
  mobile_preview_url: string | null;
  preview_url: string | null;
  current_version_id: string | null;
  website_count: number;
  versions: AdminThemeVersion[];
};

export type CategoryOption = { id: string; name: string };

export async function listAdminThemes() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_admin_themes");
  if (error) throw new Error(`Could not load themes: ${error.message}`);
  return (data ?? []) as AdminThemeRow[];
}

export async function getAdminTheme(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_theme", { p_theme_id: id });
  if (error) throw new Error(`Could not load theme: ${error.message}`);
  return (data ?? null) as AdminTheme | null;
}

export async function getAdminThemeVersionDocument(versionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_theme_version", { p_version_id: versionId });
  if (error) throw new Error(`Could not load theme version: ${error.message}`);
  return getThemePreviewDocument(data);
}

export async function listCategoryOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_public_categories");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return ((data ?? []) as CategoryOption[]).map(({ id, name }) => ({ id, name }));
}

export type ThemeCodeGrant = {
  id: string;
  email: string;
  full_name: string | null;
  note: string | null;
  expires_at: string | null;
  created_at: string;
  granted_by_email: string | null;
};

export async function listThemeCodeGrants(themeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_theme_code_grants", { p_theme_id: themeId });
  if (error) throw new Error(`Could not load code access: ${error.message}`);
  return (data ?? []) as ThemeCodeGrant[];
}

export type MyThemeCode = {
  theme_id: string;
  name: string;
  slug: string;
  thumbnail_url: string | null;
  expires_at: string | null;
  granted_at: string;
};

export async function listMyThemeCode() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_my_theme_code");
  if (error) throw new Error(`Could not load your theme code: ${error.message}`);
  return (data ?? []) as MyThemeCode[];
}
