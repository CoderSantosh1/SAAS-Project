"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type BillingResult = { error?: string; message?: string };

const planSlug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(40);

// Asks the team for a plan. Online payment is not connected yet, so an admin
// switches the plan and the request appears under Help and Support.
export async function requestPlan(slug: string): Promise<BillingResult> {
  await requireUser();
  if (!planSlug.safeParse(slug).success) return { error: "Please choose a plan." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_plan", { p_plan_slug: slug });
  if (error) {
    if (error.code === "WB001") return { error: error.message };
    if (error.code === "P0002") return { error: "That plan is not available." };
    return { error: "We could not send your request. Please try again." };
  }

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/support");
  return { message: "Request sent. Our team will contact you and switch your plan, usually within one working day." };
}
