import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { UserShell } from "@/components/user/user-sidebar";
import { brand } from "@/config/brand";
import { logout } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await requireUser();
  const name = profile.full_name ?? profile.email ?? "?";

  return (
    <UserShell
      brandName={brand.name}
      footer={
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary" aria-hidden>
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{profile.full_name ?? profile.email}</span>
            {profile.full_name && <span className="block truncate text-xs text-secondary-text">{profile.email}</span>}
          </span>
          <form action={logout}>
            <button type="submit" aria-label="Sign out" className="rounded-lg p-2.5 text-secondary-text transition-colors hover:bg-background hover:text-foreground">
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      }
    >
      {children}
    </UserShell>
  );
}
