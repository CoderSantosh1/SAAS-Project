"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const ticketSchema = z.object({
  subject: z.string().trim().min(1, "Enter a subject").max(200),
  message: z.string().trim().min(1, "Describe the problem").max(5000),
});

export async function createTicket(_: { error?: string; message?: string }, form: FormData) {
  const profile = await requireUser();
  const parsed = ticketSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details." };

  const supabase = await createClient();
  const { error } = await supabase.from("support_tickets").insert({ user_id: profile.id, ...parsed.data });
  if (error) return { error: "We could not send your request. Please try again." };

  revalidatePath("/dashboard/support");
  return { message: "Your request was sent. Our reply will appear below." };
}
