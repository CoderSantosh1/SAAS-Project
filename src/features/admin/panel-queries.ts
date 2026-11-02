import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Paged<T> = { total: number; rows: T[] };

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  account_status: string;
  created_at: string;
  website_count: number;
  published_count: number;
};

export type AdminWebsiteRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  owner_id: string;
  owner_email: string;
  category_name: string | null;
  theme_name: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type AdminUserDetail = {
  id: string;
  email: string;
  full_name: string | null;
  account_status: string;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  roles: string[];
  websites: { id: string; name: string; slug: string; status: string; published_at: string | null; updated_at: string }[];
};

export type AdminWebsiteDetail = AdminWebsiteRow & {
  description: string | null;
  business_name: string | null;
  suspended_reason: string | null;
  owner_name: string | null;
  page_count: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  thumbnail_url: string | null;
  status: string;
  is_featured: boolean;
  display_order: number;
  theme_count: number;
  website_count: number;
};

export type AdminTemplate = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  theme_id: string;
  theme_name: string;
  theme_status: string;
  preview_images: string[];
  status: string;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
  category_ids: string[];
  website_count: number;
};

export type AdminMedia = {
  id: string;
  path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
};

export type AdminDomains = {
  custom: {
    id: string;
    hostname: string;
    status: string;
    ssl_status: string;
    verification_token: string;
    verified_at: string | null;
    created_at: string;
    website_id: string;
    website_name: string;
    owner_email: string;
  }[];
  subdomains: Paged<{ id: string; name: string; slug: string; status: string; owner_email: string }>;
};

export type AdminAnalytics = {
  days: number;
  totals: {
    users: number;
    active_users: number;
    suspended_users: number;
    users_with_website: number;
    websites: number;
    published: number;
    drafts: number;
    storage_bytes: number;
  };
  series: { date: string; users: number; websites: number; published: number }[];
  popular_themes: { name: string; count: number }[];
  popular_categories: { name: string; count: number }[];
};

export type AdminPlan = {
  id: string;
  slug: string;
  name: string;
  monthly_price_paise: number;
  website_limit: number | null;
  storage_limit_mb: number | null;
  custom_domains: boolean;
  premium_themes: boolean;
  features: string[];
  is_active: boolean;
};

export type AdminTicket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_response: string | null;
  created_at: string;
  user_id: string;
  user_email: string;
  website_name: string | null;
  assignee_email: string | null;
};

export type ActivityRow = {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

async function call<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(`Could not load data (${name}): ${error.message}`);
  return data as T;
}

export const listUsers = (search?: string, status?: string, offset = 0) =>
  call<Paged<AdminUserRow>>("admin_list_users", { p_search: search ?? null, p_status: status ?? null, p_offset: offset });
export const getUser = (id: string) => call<AdminUserDetail | null>("admin_get_user", { p_user_id: id });

export const listCategories = () => call<AdminCategory[]>("admin_list_categories");
export const listTemplates = () => call<AdminTemplate[]>("admin_list_templates");

export const listWebsites = (filters: {
  search?: string;
  status?: string;
  categoryId?: string;
  ownerId?: string;
  publishedOnly?: boolean;
  offset?: number;
}) =>
  call<Paged<AdminWebsiteRow>>("admin_list_websites", {
    p_search: filters.search ?? null,
    p_status: filters.status ?? null,
    p_category_id: filters.categoryId ?? null,
    p_owner_id: filters.ownerId ?? null,
    p_published_only: filters.publishedOnly ?? false,
    p_offset: filters.offset ?? 0,
  });
export const getWebsite = (id: string) => call<AdminWebsiteDetail | null>("admin_get_website", { p_id: id });

export const listMedia = async (search?: string) => {
  const rows = await call<AdminMedia[]>("admin_list_media", { p_search: search ?? null });
  const supabase = await createClient();
  return rows.map((row) => ({
    ...row,
    url: supabase.storage.from("platform-media").getPublicUrl(row.path).data.publicUrl,
  }));
};

export const listDomains = (search?: string, offset = 0) =>
  call<AdminDomains>("admin_list_domains", { p_search: search ?? null, p_offset: offset });

export const getAnalytics = (days: number) => call<AdminAnalytics>("admin_analytics", { p_days: days });
export const listPlans = () => call<AdminPlan[]>("admin_list_plans");
export const listTickets = (status?: string, search?: string, offset = 0) =>
  call<Paged<AdminTicket>>("admin_list_tickets", { p_status: status ?? null, p_search: search ?? null, p_offset: offset });
export const listActivity = (search?: string, offset = 0, limit = 50) =>
  call<Paged<ActivityRow>>("admin_list_activity", { p_search: search ?? null, p_offset: offset, p_limit: limit });
