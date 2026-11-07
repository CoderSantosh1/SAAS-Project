"use client";

import {
  BarChart3,
  Code2,
  CreditCard,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  LifeBuoy,
  Link2,
  Plus,
  PlusCircle,
  Settings,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell, type ShellNavGroup } from "@/components/shared/app-shell";

export const USER_NAV: ShellNavGroup[] = [
  { items: [{ label: "Overview", href: "/dashboard", icon: LayoutGrid }] },
  {
    label: "Build",
    items: [
      { label: "My Websites", href: "/dashboard/websites", icon: Globe },
      { label: "Create Website", href: "/dashboard/create-website", icon: PlusCircle },
      { label: "Templates", href: "/dashboard/templates", icon: Sparkles },
      { label: "Media Library", href: "/dashboard/media", icon: ImageIcon },
      { label: "Theme Code", href: "/dashboard/theme-code", icon: Code2 },
    ],
  },
  {
    label: "Grow",
    items: [
      { label: "Domains", href: "/dashboard/domains", icon: Link2 },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Help and Support", href: "/dashboard/support", icon: LifeBuoy },
    ],
  },
];

export function UserShell({ brandName, footer, children }: { brandName: string; footer: ReactNode; children: ReactNode }) {
  return (
    <AppShell
      tone="light"
      className="ui-glass"
      label="Dashboard"
      groups={USER_NAV}
      footer={footer}
      brand={
        <Link href="/dashboard" className="flex items-center gap-2.5 font-heading text-lg font-bold text-navy">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-brand-blue text-sm text-white shadow-lg shadow-primary/25" aria-hidden>
            {brandName.slice(0, 1)}
          </span>
          {brandName}
        </Link>
      }
      topbar={
        <Link
          href="/dashboard/create-website"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-colors hover:bg-primary-hover"
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">New website</span>
          <span className="sr-only sm:hidden">New website</span>
        </Link>
      }
    >
      {children}
    </AppShell>
  );
}
