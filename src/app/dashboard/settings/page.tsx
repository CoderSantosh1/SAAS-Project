import type { Metadata } from "next";
import { PageTitle } from "@/components/user/page-title";
import { Card } from "@/components/ui/card";
import { PasswordForm, ProfileForm } from "@/features/users/components/settings-forms";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle title="Settings" description="Manage your account." />
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>
        <ProfileForm fullName={profile.full_name ?? ""} email={profile.email} />
      </Card>
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Password</h2>
        <PasswordForm />
      </Card>
    </div>
  );
}
