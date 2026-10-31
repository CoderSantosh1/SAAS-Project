import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/shared/auth-card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Access denied", robots: { index: false } };

export default function AdminForbiddenPage() {
  return (
    <AuthCard title="Access denied" description="Your account does not have permission to view this page.">
      <Link href="/dashboard" className={buttonVariants({ variant: "secondary", className: "w-full" })}>
        Go to your dashboard
      </Link>
    </AuthCard>
  );
}
