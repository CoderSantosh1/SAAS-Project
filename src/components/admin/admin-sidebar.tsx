"use client";

import {
  Activity,
  BarChart3,
  FileStack,
  FolderTree,
  Gauge,
  Globe,
  Image as ImageIcon,
  LifeBuoy,
  Link2,
  Palette,
  Rocket,
  Settings,
  Tag,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell, type ShellNavGroup, type ShellNavItem } from "@/components/shared/app-shell";
import { can, type AdminAccess, type Permission } from "@/lib/permissions";

type AdminNavItem = ShellNavItem & { permission?: Permission };

export const ADMIN_NAV: { label?: string; items: AdminNavItem[] }[] = [
  { items: [{ label: "Overview", href: "/admin", icon: Gauge }] },
  {
    label: "Marketplace",
    items: [
      { label: "Themes", href: "/admin/themes", icon: Palette, permission: "themes.manage" },
      { label: "Templates", href: "/admin/templates", icon: FileStack, permission: "templates.manage" },
      { label: "Categories", href: "/admin/categories", icon: FolderTree, permission: "categories.manage" },
      { label: "Media Library", href: "/admin/media", icon: ImageIcon, permission: "media.manage" },
    ],
  },
  {
    label: "Websites",
    items: [
      { label: "All Websites", href: "/admin/websites", icon: Globe, permission: "websites.view" },
      { label: "Published", href: "/admin/published-websites", icon: Rocket, permission: "websites.view" },
      { label: "Domains", href: "/admin/domains", icon: Link2, permission: "domains.manage" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, permission: "users.view" },
      { label: "Support Tickets", href: "/admin/support", icon: LifeBuoy, permission: "support.manage" },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: "analytics.view" },
      { label: "Plans and Pricing", href: "/admin/plans", icon: Tag, permission: "plans.manage" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Activity Logs", href: "/admin/activity-logs", icon: Activity, permission: "activity_logs.view" },
      { label: "Platform Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
    ],
  },
];

// The sections this admin may open. Groups with nothing allowed are left out.
export function adminNavFor(access: AdminAccess): ShellNavGroup[] {
  return ADMIN_NAV.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => !item.permission || can(access, item.permission)),
  })).filter((group) => group.items.length > 0);
}

export function AdminShell({
  access,
  brandName,
  footer,
  children,
}: {
  access: AdminAccess;
  brandName: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppShell
      tone="dark"
      className="ui-glass"
      label="Admin"
      groups={adminNavFor(access)}
      footer={footer}
      brand={
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-brand-blue font-heading text-sm font-bold text-white shadow-lg shadow-primary/30" aria-hidden>
            {brandName.slice(0, 1)}
          </span>
          <span className="font-heading text-lg font-bold text-white">{brandName}</span>
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-accent uppercase">Admin</span>
        </Link>
      }
      topbar={
        <Link href="/" className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-secondary-text hover:bg-background hover:text-foreground sm:inline-flex">
          View site
        </Link>
      }
    >
      {children}
    </AppShell>
  );
}
