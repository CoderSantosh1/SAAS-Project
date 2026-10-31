import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/shared/auth-card";
import { LoginForm } from "@/features/auth/components/auth-forms";
import { safeNextPath } from "@/lib/auth/routes";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to manage your websites."
      footer={
        <>
          New here?{" "}
          <Link href={`/register?next=${encodeURIComponent(safeNextPath(next))}`} className="font-medium text-primary hover:text-primary-hover">
            Create an account
          </Link>
        </>
      }
    >
      {error === "link" && (
        <p role="alert" className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          That link is invalid or has expired. Please request a new one.
        </p>
      )}
      <LoginForm next={safeNextPath(next)} />
    </AuthCard>
  );
}
