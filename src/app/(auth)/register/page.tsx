import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/shared/auth-card";
import { RegisterForm } from "@/features/auth/components/auth-forms";
import { getPlatformSettings } from "@/features/settings/queries";
import { safeNextPath } from "@/lib/auth/routes";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  const { registrationsOpen } = await getPlatformSettings();

  return (
    <AuthCard
      title="Create your account"
      description={registrationsOpen ? "Build your website without coding." : "New registrations are closed at the moment."}
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </>
      }
    >
      {registrationsOpen ? <RegisterForm next={next} /> : <p className="text-sm text-secondary-text">Please check back soon.</p>}
    </AuthCard>
  );
}
