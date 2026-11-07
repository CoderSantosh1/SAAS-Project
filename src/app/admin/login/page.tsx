import type { Metadata } from "next";
import { AuthCard } from "@/components/shared/auth-card";
import { AdminLoginForm } from "@/features/auth/components/auth-forms";
import { safeNextPath } from "@/lib/auth/routes";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthCard variant="admin" title="Admin sign in" description="For authorized administrators only.">
      <AdminLoginForm next={safeNextPath(next, "/admin")} />
    </AuthCard>
  );
}
