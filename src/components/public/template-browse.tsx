import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicCategory } from "@/features/marketplace/queries";
import { cn } from "@/lib/utils";

// Shared building blocks for the template galleries on the public site and the dashboard.
// Everything is a plain link or GET form, so filters work without JavaScript and can be shared.

export const TEMPLATES_PER_PAGE = 12;

type Filters = { q?: string; category?: string; page?: number };

export function browseHref(basePath: string, filters: Filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function paginate<T>(items: T[], page: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / TEMPLATES_PER_PAGE));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    items: items.slice((current - 1) * TEMPLATES_PER_PAGE, current * TEMPLATES_PER_PAGE),
    page: current,
    pageCount,
  };
}

export function TemplateSearch({ basePath, q, category }: { basePath: string; q?: string; category?: string }) {
  return (
    <form action={basePath} role="search" className="flex flex-col gap-3 sm:flex-row">
      {category && <input type="hidden" name="category" value={category} />}
      <div className="relative flex-1">
        <Search className="absolute top-3 left-3 size-4 text-muted-text" aria-hidden />
        <Input name="q" type="search" defaultValue={q} placeholder="Search templates, like restaurant or salon" aria-label="Search templates" className="pl-9" maxLength={80} />
      </div>
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}

export function CategoryChips({
  basePath,
  categories,
  q,
  category,
  total,
}: {
  basePath: string;
  categories: PublicCategory[];
  q?: string;
  category?: string;
  total?: number;
}) {
  const options = categories.filter((option) => Number(option.template_count) > 0 || option.slug === category);
  const chip = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
      active ? "border-primary bg-primary text-white" : "border-border bg-surface text-secondary-text hover:border-primary/40 hover:text-foreground",
    );

  return (
    <nav aria-label="Template categories" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 sm:flex-wrap">
        <li>
          <Link href={browseHref(basePath, { q })} aria-current={!category ? "page" : undefined} className={chip(!category)}>
            All
            {total !== undefined && <span className="text-xs opacity-75">{total}</span>}
          </Link>
        </li>
        {options.map((option) => (
          <li key={option.id}>
            <Link
              href={browseHref(basePath, { q, category: option.slug })}
              aria-current={option.slug === category ? "page" : undefined}
              className={chip(option.slug === category)}
            >
              {option.name}
              <span className="text-xs opacity-75">{option.template_count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Pagination({ basePath, filters, page, pageCount }: { basePath: string; filters: Filters; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const link = "inline-flex size-10 items-center justify-center rounded-md border text-sm font-medium transition-colors";
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={browseHref(basePath, { ...filters, page: page - 1 })} className={cn(link, "border-border hover:bg-surface")} aria-label="Previous page">
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(link, "border-border opacity-40")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}
      {pages.map((number) => (
        <Link
          key={number}
          href={browseHref(basePath, { ...filters, page: number })}
          aria-current={number === page ? "page" : undefined}
          className={cn(link, number === page ? "border-primary bg-primary text-white" : "border-border hover:bg-surface")}
        >
          {number}
        </Link>
      ))}
      {page < pageCount ? (
        <Link href={browseHref(basePath, { ...filters, page: page + 1 })} className={cn(link, "border-border hover:bg-surface")} aria-label="Next page">
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(link, "border-border opacity-40")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
