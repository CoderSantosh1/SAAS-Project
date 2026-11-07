import "server-only";
import { createClient } from "@/lib/supabase/server";

export type BillingPlan = {
  slug: string;
  name: string;
  monthly_price_paise: number;
  website_limit: number | null;
  storage_limit_mb: number | null;
  custom_domains: boolean;
  premium_themes: boolean;
  features: string[];
  is_active?: boolean;
  is_current?: boolean;
};

export type MyBilling = {
  plan: BillingPlan;
  subscription: { status: string; current_period_start: string | null; current_period_end: string | null } | null;
  usage: { websites: number; published: number; storage_bytes: number };
  plans: BillingPlan[];
  pending_request: string | null;
  payments: { amount_paise: number; currency: string; status: string; created_at: string }[];
};

export async function getMyBilling() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_billing");
  if (error) throw new Error(`Could not load billing: ${error.message}`);
  return data as MyBilling;
}
