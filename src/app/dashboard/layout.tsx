import { LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { UserSidebar } from "@/components/user/user-sidebar";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { logout } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex min-w-0 flex-col gap-4 border-b border-border bg-surface p-4 md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0">
        <Link href="/dashboard" className="px-3 font-heading text-xl font-bold text-primary">
          {brand.name}
        </Link>
        <UserSidebar />
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3 md:mt-auto">
          <span className="truncate px-3 text-sm text-secondary-text">
            {profile.full_name ?? profile.email}
          </span>
          <form action={logout}>
            <Button type="submit" variant="ghost" aria-label="Sign out" className="px-3">
              <LogOut className="size-4" aria-hidden />
            </Button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
