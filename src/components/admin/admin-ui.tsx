import { ArrowLeft, ChevronLeft, ChevronRight, Search, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AdminPage({
  title,
  description,
  action,
  back,
  children,
  narrow,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back?: { href: string; label: string };
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={cn("mx-auto space-y-6", narrow ? "max-w-3xl" : "max-w-6xl")}>
      {back && (
        <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-text hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-secondary-text">{description}</p>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export type Stat = { label: string; value: ReactNode; icon?: LucideIcon; hint?: string; href?: string };

const STAT_TONES = ["bg-primary-light text-primary", "bg-success/10 text-green-700", "bg-warning/15 text-amber-700", "bg-sky-100 text-sky-700"];

export function StatCard({ stat, index = 0 }: { stat: Stat; index?: number }) {
  const Icon = stat.icon;
  const body = (
    <Card className={cn("flex h-full items-center gap-3.5 px-4 py-3.5", stat.href && "transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated")}>
      {Icon && (
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", STAT_TONES[index % STAT_TONES.length])}>
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-secondary-text">{stat.label}</span>
        <span className="block font-heading text-xl font-semibold text-navy tabular-nums">{stat.value}</span>
        {stat.hint && <span className="block truncate text-xs text-secondary-text">{stat.hint}</span>}
      </span>
    </Card>
  );
  return stat.href ? (
    <Link href={stat.href} className="block rounded-lg">
      {body}
    </Link>
  ) : (
    body
  );
}

export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={stat.label} stat={stat} index={index} />
      ))}
    </div>
  );
}

export { EmptyState };

// A plain GET form, so filters work without JavaScript and can be linked to.
export function FilterBar({
  action,
  search,
  placeholder,
  selects = [],
}: {
  action: string;
  search?: string;
  placeholder: string;
  selects?: { name: string; label: string; value?: string; options: { value: string; label: string }[] }[];
}) {
  return (
    <form action={action} role="search" className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-2 shadow-card sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute top-3 left-3 size-4 text-muted-text" aria-hidden />
        <Input name="q" type="search" defaultValue={search} maxLength={80} placeholder={placeholder} aria-label={placeholder} className="border-transparent bg-background pl-9 focus-visible:bg-surface" />
      </div>
      {selects.map((select) => (
        <select key={select.name} name={select.name} defaultValue={select.value ?? ""} aria-label={select.label} className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
          <option value="">{select.label}</option>
          {select.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      <Button type="submit">Apply</Button>
    </form>
  );
}

export function DataTable({
  headers,
  empty,
  isEmpty,
  children,
}: {
  headers: string[];
  empty: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border bg-background/70 text-[11px] font-semibold tracking-wider text-secondary-text uppercase">
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col" className="px-4 py-3 whitespace-nowrap">
                {header || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border [&>tr]:transition-colors [&>tr:hover]:bg-background/60">{children}</tbody>
      </table>
      </div>
      {isEmpty && <EmptyState title="Nothing here yet" text={empty} />}
    </Card>
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 text-secondary-text", className)} {...props} />;
}

const PAGE_BUTTON =
  "inline-flex h-9 items-center gap-1 rounded-md border border-border bg-surface px-3 font-medium text-foreground shadow-card transition-colors hover:bg-background";

export function Pagination({
  path,
  params,
  offset,
  total,
  pageSize = 50,
}: {
  path: string;
  params: Record<string, string | undefined>;
  offset: number;
  total: number;
  pageSize?: number;
}) {
  if (total <= pageSize) return null;
  const href = (next: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    if (next > 0) search.set("offset", String(next));
    return `${path}?${search}`;
  };
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm text-secondary-text">
      <span className="tabular-nums">
        Showing {offset + 1} to {Math.min(offset + pageSize, total)} of {total}
      </span>
      <div className="flex gap-2">
        {offset > 0 && (
          <Link href={href(Math.max(0, offset - pageSize))} className={PAGE_BUTTON}>
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Link>
        )}
        {offset + pageSize < total && (
          <Link href={href(offset + pageSize)} className={PAGE_BUTTON}>
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </nav>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/10 text-green-800",
  published: "bg-success/10 text-green-800",
  verified: "bg-success/10 text-green-800",
  resolved: "bg-success/10 text-green-800",
  draft: "bg-background text-secondary-text",
  unpublished: "bg-background text-secondary-text",
  closed: "bg-background text-secondary-text",
  low: "bg-background text-secondary-text",
  normal: "bg-background text-secondary-text",
  pending: "bg-warning/15 text-amber-800",
  open: "bg-warning/15 text-amber-800",
  in_progress: "bg-primary-light text-primary-hover",
  high: "bg-warning/15 text-amber-800",
  suspended: "bg-danger/10 text-red-700",
  failed: "bg-danger/10 text-red-700",
  archived: "bg-danger/10 text-red-700",
  urgent: "bg-danger/10 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap capitalize", STATUS_STYLES[status] ?? "bg-background text-secondary-text")}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "None";
}

export const parseOffset = (value: string | undefined) => {
  const offset = Number(value);
  return Number.isInteger(offset) && offset > 0 ? offset : 0;
};
