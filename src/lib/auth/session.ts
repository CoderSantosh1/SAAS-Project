import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { can, type AdminAccess, type Permission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  account_status: "active" | "suspended";
};

type AdminAccessRow = {
  role_slug: string;
  is_super: boolean;
  permission_key: string | null;
};

// getUser() validates the token with Supabase rather than trusting the cookie.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, account_status")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(`Could not load profile: ${error.message}`);
  return data as Profile;
});

export const getAdminAccess = cache(async (): Promise<AdminAccess | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_admin_access");

  if (error) throw new Error(`Could not load admin access: ${error.message}`);

  const rows = (data ?? []) as AdminAccessRow[];
  if (rows.length === 0) return null;

  return {
    isSuper: rows.some((row) => row.is_super),
    roles: [...new Set(rows.map((row) => row.role_slug))],
    permissions: [
      ...new Set(rows.flatMap((row) => (row.permission_key ? [row.permission_key] : []))),
    ],
  };
});

// Call these in every protected page and server action. Layouts alone are not
// enough, because a page can render or an action can run without them.
export async function requireUser() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.account_status === "suspended") redirect("/account-suspended");
  return profile;
}

export async function requireAdmin(permission?: Permission) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");

  const access = await getAdminAccess();
  if (!access || (permission && !can(access, permission))) {
    redirect("/admin/forbidden");
  }

  return { profile, access };
}
