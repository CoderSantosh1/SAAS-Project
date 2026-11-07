import type { Metadata } from "next";
import { PageTitle } from "@/components/user/page-title";
import { Card } from "@/components/ui/card";
import { PasswordForm, ProfileForm } from "@/features/users/components/settings-forms";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await requireUser();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageTitle title="Settings" description="Manage your account." />
      <Card className="flex items-center gap-4 p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-heading text-xl font-semibold text-white" aria-hidden>
          {(profile.full_name ?? profile.email ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-heading text-lg font-semibold text-navy">{profile.full_name ?? "Your account"}</span>
          <span className="block truncate text-sm text-secondary-text">{profile.email}</span>
        </span>
      </Card>
      <Card className="grid gap-6 p-6 md:grid-cols-[14rem_1fr]">
        <div>
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="mt-1 text-sm text-secondary-text">Your name as it appears in the dashboard and on support requests.</p>
        </div>
        <ProfileForm fullName={profile.full_name ?? ""} email={profile.email} />
      </Card>
      <Card className="grid gap-6 p-6 md:grid-cols-[14rem_1fr]">
        <div>
          <h2 className="text-lg font-semibold">Password</h2>
          <p className="mt-1 text-sm text-secondary-text">Choose a strong password you do not use anywhere else.</p>
        </div>
        <PasswordForm />
      </Card>
    </div>
  );
}
