import { LogOut } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { brand } from "@/config/brand";
import { adminLogout } from "@/features/auth/actions";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, access } = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex min-w-0 flex-col gap-4 bg-navy p-4 md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:overflow-y-auto">
        <Link href="/admin" className="flex items-baseline gap-2 px-3">
          <span className="font-heading text-xl font-bold text-white">{brand.name}</span>
          <span className="text-xs font-semibold tracking-wide text-accent uppercase">Admin</span>
        </Link>
        <AdminSidebar access={access} />
        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3 md:mt-auto">
          <span className="truncate px-3 text-sm text-white/70">{profile.email}</span>
          <form action={adminLogout}>
            <button
              type="submit"
              aria-label="Sign out"
              className="rounded-md p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
