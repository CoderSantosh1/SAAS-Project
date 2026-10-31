import type { Metadata } from "next";
import { AuthCard } from "@/components/shared/auth-card";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Account suspended" };

export default function AccountSuspendedPage() {
  return (
    <AuthCard
      title="Your account is suspended"
      description="Your websites and data are safe, but you cannot make changes while the account is suspended."
    >
      <form action={logout}>
        <Button type="submit" variant="secondary" className="w-full">
          Sign out
        </Button>
      </form>
    </AuthCard>
  );
}
