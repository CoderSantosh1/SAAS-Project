"use client";

import { ChevronRight, Menu, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// The frame shared by the admin panel and the user dashboard: a grouped sidebar on wide
// screens, a top bar with breadcrumbs, and a slide-out menu on phones.

export type ShellNavItem = { label: string; href: string; icon: LucideIcon; soon?: boolean };
export type ShellNavGroup = { label?: string; items: ShellNavItem[] };

type Tone = "dark" | "light";

const TONES = {
  dark: {
    // A deep purple-to-navy panel; on glass pages the mesh glows faintly through it.
    aside: "bg-gradient-to-b from-[#1d1652]/95 via-navy/95 to-[#0f1f4d]/95 text-white backdrop-blur-xl",
    divider: "border-white/10",
    group: "text-white/40",
    item: "text-white/70 hover:bg-white/[0.07] hover:text-white",
    active: "bg-white/10 text-white shadow-[inset_2px_0_0_var(--accent)]",
    activeIcon: "text-accent",
    soon: "text-white/35",
    close: "text-white/70 hover:bg-white/10",
  },
  light: {
    aside: "bg-surface text-foreground",
    divider: "border-border",
    group: "text-muted-text",
    item: "text-secondary-text hover:bg-background hover:text-foreground",
    active: "bg-primary-light text-primary-hover shadow-[inset_2px_0_0_var(--primary)]",
    activeIcon: "text-primary",
    soon: "text-muted-text",
    close: "text-secondary-text hover:bg-background",
  },
} as const;

// The item for the current page: an exact match, or the longest prefix.
export function activeNavItem(groups: ShellNavGroup[], pathname: string) {
  const items = groups.flatMap((group) => group.items).filter((item) => !item.soon);
  const matches = items.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return matches.sort((a, b) => b.href.length - a.href.length)[0] ?? null;
}

// Area, then section, then "Details" for a page inside a section.
export function breadcrumbs(groups: ShellNavGroup[], pathname: string, area: string) {
  const home = groups[0]?.items[0];
  const current = activeNavItem(groups, pathname);
  const crumbs: { label: string; href?: string }[] = [{ label: area, href: home?.href }];
  if (current && current.href !== home?.href) crumbs.push({ label: current.label, href: current.href });
  if (current && pathname !== current.href) crumbs.push({ label: "Details" });
  if (crumbs.length === 1 && home) crumbs.push({ label: home.label });
  return crumbs;
}

function NavList({ groups, tone, pathname, onNavigate }: { groups: ShellNavGroup[]; tone: Tone; pathname: string; onNavigate?: () => void }) {
  const styles = TONES[tone];
  const active = activeNavItem(groups, pathname);

  return (
    <div className="space-y-5">
      {groups.map((group, index) => (
        <div key={group.label ?? index}>
          {group.label && <p className={cn("mb-1.5 px-3 text-[11px] font-semibold tracking-[0.12em] uppercase", styles.group)}>{group.label}</p>}
          <ul className="space-y-0.5">
            {group.items.map(({ label, href, icon: Icon, soon }) => {
              const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
              if (soon) {
                return (
                  <li key={href}>
                    <span aria-disabled="true" className={cn(base, "cursor-not-allowed", styles.soon)}>
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{label}</span>
                      <span className="ml-auto rounded-full border border-current/30 px-1.5 py-px text-[10px] font-semibold tracking-wide uppercase">Soon</span>
                    </span>
                  </li>
                );
              }
              const current = active?.href === href;
              return (
                <li key={href}>
                  <Link href={href} onClick={onNavigate} aria-current={current ? "page" : undefined} className={cn(base, current ? styles.active : styles.item)}>
                    <Icon className={cn("size-4 shrink-0", current && styles.activeIcon)} aria-hidden />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AppShell({
  tone,
  label,
  brand,
  groups,
  footer,
  topbar,
  className,
  children,
}: {
  tone: Tone;
  // Names the navigation for screen readers, such as "Admin".
  label: string;
  brand: ReactNode;
  groups: ShellNavGroup[];
  footer: ReactNode;
  topbar?: ReactNode;
  // Adds a design scope, such as "ui-glass" for the user dashboard.
  className?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // The menu remembers the page it was opened on, so it closes by itself after navigating.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const styles = TONES[tone];
  const crumbs = breadcrumbs(groups, pathname, label);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const sidebar = (onNavigate?: () => void) => (
    <>
      <div className="flex h-16 shrink-0 items-center px-4">{brand}</div>
      <nav aria-label={label} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <NavList groups={groups} tone={tone} pathname={pathname} onNavigate={onNavigate} />
      </nav>
      <div className={cn("shrink-0 border-t p-3", styles.divider)}>{footer}</div>
    </>
  );

  return (
    <div className={cn("min-h-dvh lg:grid lg:grid-cols-[16.5rem_1fr]", className)}>
      <aside className={cn("sticky top-0 hidden h-dvh flex-col border-r lg:flex", styles.aside, styles.divider)}>{sidebar()}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={`${label} menu`}>
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className={cn("relative flex h-full w-[min(18rem,85vw)] flex-col shadow-2xl", styles.aside)}>
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className={cn("absolute top-3.5 right-3 rounded-lg p-2", styles.close)}>
              <X className="size-5" aria-hidden />
            </button>
            {sidebar(() => setOpen(false))}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="-ml-1 rounded-lg p-2 text-secondary-text hover:bg-background hover:text-foreground lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex min-w-0 items-center gap-1.5 text-sm">
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <li key={crumb.label} className={cn("flex min-w-0 items-center gap-1.5", !last && "hidden sm:flex")}>
                    {index > 0 && <ChevronRight className="hidden size-3.5 shrink-0 text-muted-text sm:block" aria-hidden />}
                    {crumb.href && !last ? (
                      <Link href={crumb.href} className="truncate text-secondary-text hover:text-foreground">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current={last ? "page" : undefined} className="truncate font-medium text-foreground">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          {topbar}
        </header>
        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
