import type { Metadata } from "next";
import { AuthCard } from "@/components/shared/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/auth-forms";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password" description="Choose a password you have not used here before.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
