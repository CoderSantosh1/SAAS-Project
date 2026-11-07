import {
  ArrowRight,
  FileStack,
  FolderTree,
  Globe,
  LifeBuoy,
  Palette,
  Rocket,
  Settings,
  UserCheck,
  UserX,
  Users,
  type LucideIcon,
  FilePen,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, StatCard, type Stat } from "@/components/admin/admin-ui";
import { Card } from "@/components/ui/card";
import { getAdminOverviewStats } from "@/features/admin/queries";
import { listAdminThemes } from "@/features/themes/queries";
import { requireAdmin } from "@/lib/auth/session";
import { can, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview" };

// Icons and destinations for the statistics in features/admin/queries.ts, by label.
const STAT_DETAILS: Record<string, { icon: LucideIcon; href: string }> = {
  "Total users": { icon: Users, href: "/admin/users" },
  "Active users": { icon: UserCheck, href: "/admin/users?status=active" },
  "Suspended users": { icon: UserX, href: "/admin/users?status=suspended" },
  "Total websites": { icon: Globe, href: "/admin/websites" },
  "Published websites": { icon: Rocket, href: "/admin/published-websites" },
  "Draft websites": { icon: FilePen, href: "/admin/websites?status=draft" },
  Themes: { icon: Palette, href: "/admin/themes" },
  Templates: { icon: FileStack, href: "/admin/templates" },
  Categories: { icon: FolderTree, href: "/admin/categories" },
};

const QUICK_ACTIONS: { label: string; text: string; href: string; icon: LucideIcon; permission: Permission }[] = [
  { label: "Review themes", text: "Publish new themes to the marketplace", href: "/admin/themes?status=under_review", icon: Palette, permission: "themes.manage" },
  { label: "Manage users", text: "Search, suspend and restore accounts", href: "/admin/users", icon: Users, permission: "users.view" },
  { label: "Support tickets", text: "Answer questions from customers", href: "/admin/support", icon: LifeBuoy, permission: "support.manage" },
  { label: "Categories", text: "Organise what visitors browse", href: "/admin/categories", icon: FolderTree, permission: "categories.manage" },
  { label: "Websites", text: "See every site on the platform", href: "/admin/websites", icon: Globe, permission: "websites.view" },
  { label: "Platform settings", text: "Name, SEO and maintenance mode", href: "/admin/settings", icon: Settings, permission: "settings.manage" },
];

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminOverviewPage() {
  const { profile, access } = await requireAdmin();
  const [stats, themes] = await Promise.all([
    getAdminOverviewStats(access),
    can(access, "themes.manage") ? listAdminThemes() : Promise.resolve([]),
  ]);
  const underReview = themes.filter((theme) => theme.status === "under_review").length;
  const actions = QUICK_ACTIONS.filter((action) => can(access, action.permission));
  const firstName = profile.full_name?.split(" ")[0];
  const hour = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));

  const cards: Stat[] = stats.map((stat) => ({
    label: stat.label,
    value: stat.value.toLocaleString("en-IN"),
    icon: STAT_DETAILS[stat.label]?.icon,
    href: STAT_DETAILS[stat.label]?.href,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1f8f] via-primary-hover to-brand-blue p-6 text-white shadow-elevated sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 size-72 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-sm font-medium text-white/80">Admin overview</p>
          <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
            {greeting(hour)}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-2 max-w-xl text-white/70">Here is what is happening across the platform today. Every number links to the full list.</p>
        </div>
      </section>

      {underReview > 0 && (
        <Card className="flex flex-col gap-4 border-primary/25 bg-gradient-to-r from-primary-light to-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
              <Palette className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-foreground">
                {underReview} {underReview === 1 ? "theme is" : "themes are"} waiting for review
              </p>
              <p className="text-sm text-secondary-text">Preview them, then publish them to the marketplace in one step.</p>
            </div>
          </div>
          <Link href="/admin/themes?status=under_review" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">
            Review themes
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Card>
      )}

      <section aria-labelledby="stats-heading" className="space-y-3">
        <h2 id="stats-heading" className="text-lg font-semibold">
          Platform at a glance
        </h2>
        {cards.length === 0 ? (
          <Card>
            <EmptyState title="No statistics for your role" text="Ask a super admin if you need access to more of the platform." />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        )}
      </section>

      {actions.length > 0 && (
        <section aria-labelledby="actions-heading" className="space-y-3">
          <h2 id="actions-heading" className="text-lg font-semibold">
            Quick actions
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map(({ label, text, href, icon: Icon }, index) => (
              <li key={href}>
                <Link href={href} className="group flex h-full items-center gap-4 rounded-lg border border-border bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated">
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", index % 2 ? "bg-sky-100 text-sky-700" : "bg-primary-light text-primary")}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{label}</span>
                    <span className="block text-sm text-secondary-text">{text}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-text transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
