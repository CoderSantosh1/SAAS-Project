"use server";

import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getPlatformSettings } from "@/features/settings/queries";
import { safeNextPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type RegisterValues,
  type ResetPasswordValues,
} from "./schemas";

export type AuthResult = { error?: string; message?: string };

const INVALID_INPUT = "Please check the details you entered.";
const INVALID_LOGIN = "Incorrect email or password.";
const SERVICE_UNAVAILABLE = "We could not reach the sign-in service. Please try again.";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function callbackUrl(next: string) {
  return `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function login(values: LoginValues, next?: string): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: INVALID_INPUT };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (isAuthRetryableFetchError(error)) return { error: SERVICE_UNAVAILABLE };
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Please verify your email first. Check your inbox for the link."
          : INVALID_LOGIN,
    };
  }

  redirect(safeNextPath(next));
}

// Gives the same answer for a wrong password and a non-admin account, so this
// page cannot be used to find out who the administrators are.
export async function adminLogin(values: LoginValues, next?: string): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: INVALID_INPUT };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: isAuthRetryableFetchError(error) ? SERVICE_UNAVAILABLE : INVALID_LOGIN };
  }

  const { data: isAdmin, error: accessError } = await supabase.rpc("is_admin");
  if (accessError || !isAdmin) {
    await supabase.auth.signOut();
    return { error: INVALID_LOGIN };
  }

  const { error: logError } = await supabase.rpc("log_activity", { action: "admin.login" });
  if (logError) {
    // Admin access must not go unrecorded.
    await supabase.auth.signOut();
    return { error: "Could not record this sign-in. Please try again." };
  }

  redirect(safeNextPath(next, "/admin"));
}

export async function register(values: RegisterValues, next?: string): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return { error: INVALID_INPUT };

  if (!(await getPlatformSettings()).registrationsOpen) {
    return { error: "New registrations are closed at the moment." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: callbackUrl(safeNextPath(next)),
    },
  });

  if (error) {
    return {
      error:
        error.code === "weak_password"
          ? "That password is too weak. Please choose a stronger one."
          : "We could not create your account. Please try again.",
    };
  }

  // A session only exists here when the project has email confirmation turned off.
  if (data.session) redirect(safeNextPath(next));

  return { message: "Check your email for a link to verify your account." };
}

export async function requestPasswordReset(values: ForgotPasswordValues): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { error: INVALID_INPUT };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl("/reset-password"),
  });

  // The same answer either way, so this cannot reveal who has an account.
  return { message: "If that email has an account, a reset link is on its way." };
}

export async function resetPassword(values: ResetPasswordValues): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) return { error: INVALID_INPUT };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "Choose a password different from your current one."
          : "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function adminLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
