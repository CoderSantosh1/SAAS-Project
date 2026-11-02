import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export type MarketplaceTemplate = {
  template_id: string;
  template_slug: string;
  name: string;
  description: string | null;
  is_featured: boolean;
  is_premium: boolean;
  thumbnail_url: string | null;
  theme_slug: string;
  category_names: string[];
};

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  template_count: number;
};

export type MarketplaceTheme = {
  name: string;
  slug: string;
  description: string | null;
  is_premium: boolean;
  author_name: string | null;
  supported_features: string[];
  thumbnail_url: string | null;
  version: string | null;
  primary_color: string | null;
  categories: { name: string; slug: string }[];
};

export type PublicPlan = {
  slug: string;
  name: string;
  monthly_price_paise: number;
  features: string[];
};

export async function listTemplates(
  filters: { categorySlug?: string; search?: string; featuredOnly?: boolean; limit?: number } = {},
) {
  const { data, error } = await createPublicClient().rpc("list_marketplace_templates", {
    p_category_slug: filters.categorySlug ?? null,
    p_search: filters.search ?? null,
    p_featured_only: filters.featuredOnly ?? false,
    p_limit: filters.limit ?? 100,
  });
  if (error) throw new Error(`Could not load templates: ${error.message}`);
  return (data ?? []) as MarketplaceTemplate[];
}

export async function listCategories() {
  const { data, error } = await createPublicClient().rpc("list_public_categories");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return (data ?? []) as PublicCategory[];
}

export async function getTheme(slug: string) {
  const { data, error } = await createPublicClient().rpc("get_marketplace_theme", {
    p_theme_slug: slug,
  });
  if (error) throw new Error(`Could not load theme: ${error.message}`);
  return (data ?? null) as MarketplaceTheme | null;
}

export async function listPlans() {
  const { data, error } = await createPublicClient()
    .from("plans")
    .select("slug, name, monthly_price_paise, features")
    .eq("is_active", true)
    .order("display_order");
  if (error) throw new Error(`Could not load plans: ${error.message}`);
  return (data ?? []) as PublicPlan[];
}

