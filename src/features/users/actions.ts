"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema, profileSchema, type PasswordValues, type ProfileValues } from "./schemas";

type ActionResult = { error?: string; message?: string };

export async function updateProfile(values: ProfileValues): Promise<ActionResult> {
  const profile = await requireUser();
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the details you entered." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", profile.id);
  if (error) return { error: "We could not save your profile. Please try again." };

  revalidatePath("/dashboard", "layout");
  return { message: "Profile saved." };
}

export async function changePassword(values: PasswordValues): Promise<ActionResult> {
  const profile = await requireUser();
  const parsed = passwordSchema.safeParse(values);
  if (!parsed.success) return { error: "Please check the details you entered." };

  const supabase = await createClient();

  // Confirms it is really the account holder, not someone at an unattended session.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) return { error: "Your current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "Choose a password different from your current one."
          : "We could not change your password. Please try again.",
    };
  }

  return { message: "Password changed." };
}
