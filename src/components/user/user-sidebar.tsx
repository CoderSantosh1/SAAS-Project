"use client";

import {
  BarChart3,
  CreditCard,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  LifeBuoy,
  Link2,
  PlusCircle,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon; ready: boolean };

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutGrid, ready: true },
  { label: "My Websites", href: "/dashboard/websites", icon: Globe, ready: true },
  { label: "Create Website", href: "/dashboard/create-website", icon: PlusCircle, ready: true },
  { label: "Templates", href: "/dashboard/templates", icon: Sparkles, ready: true },
  { label: "Media Library", href: "/dashboard/media", icon: ImageIcon, ready: true },
  { label: "Domains", href: "/dashboard/domains", icon: Link2, ready: false },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, ready: false },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard, ready: false },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, ready: true },
  { label: "Help and Support", href: "/dashboard/support", icon: LifeBuoy, ready: false },
];

export function UserSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {NAV_ITEMS.map(({ label, href, icon: Icon, ready }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
        const content = (
          <>
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{label}</span>
            {!ready && <span className="ml-auto pl-2 text-xs text-muted-text">Soon</span>}
          </>
        );
        const base = "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium";

        if (!ready) {
          return (
            <span key={href} aria-disabled="true" className={cn(base, "cursor-not-allowed text-muted-text")}>
              {content}
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              base,
              "transition-colors",
              active
                ? "bg-primary-light text-primary-hover"
                : "text-secondary-text hover:bg-background hover:text-foreground",
            )}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
