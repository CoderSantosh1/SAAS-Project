import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && <p className="mt-1 text-sm text-secondary-text">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatRow({ stats }: { stats: { label: string; value: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="px-4 py-3">
          <p className="text-xs font-medium text-secondary-text">{stat.label}</p>
          <p className="mt-0.5 font-heading text-xl font-semibold text-navy">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}

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
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute top-3 left-3 size-4 text-muted-text" aria-hidden />
        <Input name="q" type="search" defaultValue={search} maxLength={80} placeholder={placeholder} aria-label={placeholder} className="pl-9" />
      </div>
      {selects.map((select) => (
        <select key={select.name} name={select.name} defaultValue={select.value ?? ""} aria-label={select.label} className="h-10 rounded-md border border-border bg-surface px-3 text-sm">
          <option value="">{select.label}</option>
          {select.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
      <Button type="submit" variant="secondary">
        Apply
      </Button>
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
    <Card className="relative overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border text-xs font-semibold text-secondary-text">
          <tr>
            {headers.map((header, index) => (
              <th key={index} scope="col" className="px-4 py-3">
                {header || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
      {isEmpty && <p className="px-4 py-10 text-center text-sm text-secondary-text">{empty}</p>}
    </Card>
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 text-secondary-text", className)} {...props} />;
}

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
    <div className="flex items-center justify-between text-sm text-secondary-text">
      <span>
        {offset + 1} to {Math.min(offset + pageSize, total)} of {total}
      </span>
      <div className="flex gap-3 font-semibold text-primary-hover">
        {offset > 0 && <Link href={href(Math.max(0, offset - pageSize))}>Previous</Link>}
        {offset + pageSize < total && <Link href={href(offset + pageSize)}>Next</Link>}
      </div>
    </div>
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
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap capitalize", STATUS_STYLES[status] ?? "bg-background text-secondary-text")}>
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
