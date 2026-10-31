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
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { can, type AdminAccess, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  ready: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/admin", icon: Gauge, ready: true },
  { label: "Users", href: "/admin/users", icon: Users, permission: "users.view", ready: false },
  { label: "Categories", href: "/admin/categories", icon: FolderTree, permission: "categories.manage", ready: false },
  { label: "Themes", href: "/admin/themes", icon: Palette, permission: "themes.manage", ready: false },
  { label: "Templates", href: "/admin/templates", icon: FileStack, permission: "templates.manage", ready: false },
  { label: "Websites", href: "/admin/websites", icon: Globe, permission: "websites.view", ready: false },
  { label: "Published Websites", href: "/admin/published-websites", icon: Rocket, permission: "websites.view", ready: false },
  { label: "Media Library", href: "/admin/media", icon: ImageIcon, permission: "media.manage", ready: false },
  { label: "Domains", href: "/admin/domains", icon: Link2, permission: "domains.manage", ready: false },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, permission: "analytics.view", ready: false },
  { label: "Plans and Pricing", href: "/admin/plans", icon: Tag, permission: "plans.manage", ready: false },
  { label: "Support Tickets", href: "/admin/support", icon: LifeBuoy, permission: "support.manage", ready: false },
  { label: "Activity Logs", href: "/admin/activity-logs", icon: Activity, permission: "activity_logs.view", ready: false },
  { label: "Platform Settings", href: "/admin/settings", icon: Settings, permission: "settings.manage", ready: false },
];

export function AdminSidebar({ access }: { access: AdminAccess }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.permission || can(access, item.permission));

  return (
    <nav aria-label="Admin" className="flex gap-0.5 overflow-x-auto md:flex-col md:overflow-visible">
      {items.map(({ label, href, icon: Icon, ready }) => {
        const content = (
          <>
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{label}</span>
            {!ready && <span className="ml-auto pl-2 text-xs text-white/40">Soon</span>}
          </>
        );
        const base = "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium";

        if (!ready) {
          return (
            <span key={href} aria-disabled="true" className={cn(base, "cursor-not-allowed text-white/40")}>
              {content}
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={cn(
              base,
              "transition-colors",
              pathname === href ? "bg-primary text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
