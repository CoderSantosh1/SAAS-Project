import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-sidebar";
import { brand } from "@/config/brand";
import { adminLogout } from "@/features/auth/actions";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false } };

function roleLabel(access: { isSuper: boolean; roles: string[] }) {
  if (access.isSuper) return "Super admin";
  const role = access.roles[0];
  return role ? role.replaceAll("_", " ").replace(/^./, (char) => char.toUpperCase()) : "Admin";
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, access } = await requireAdmin();
  const name = profile.full_name ?? profile.email ?? "Admin";

  return (
    <AdminShell
      access={access}
      brandName={brand.name}
      footer={
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-accent/80 text-sm font-semibold text-white" aria-hidden>
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{name}</span>
            <span className="block truncate text-xs text-white/50">{roleLabel(access)}</span>
          </span>
          <form action={adminLogout}>
            <button type="submit" aria-label="Sign out" className="rounded-lg p-2.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      }
    >
      {children}
    </AdminShell>
  );
}
