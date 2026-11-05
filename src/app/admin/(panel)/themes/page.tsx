import { ExternalLink, Palette, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BulkPublishButton } from "@/features/themes/components/theme-actions";
import { ThemeStatusBadge } from "@/features/themes/components/theme-status-badge";
import { listAdminThemes } from "@/features/themes/queries";
import { requireAdmin } from "@/lib/auth/session";
import { getThemeDefinitionBySlug } from "@/themes/registry";

export const metadata: Metadata = { title: "Themes" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "under_review", label: "Under review" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
  { value: "archived", label: "Archived" },
];

const filtersSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(["draft", "under_review", "published", "unpublished", "archived"]).optional().catch(undefined),
  category: z.string().trim().max(80).optional().catch(undefined),
});

export default async function AdminThemesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("themes.manage");
  const { q, status, category } = filtersSchema.parse(await searchParams);
  const themes = await listAdminThemes();

  const count = (match: (theme: (typeof themes)[number]) => boolean) => themes.filter(match).length;
  // Each count links to the list filtered by that status.
  const stats = [
    { label: "Total themes", value: themes.length, href: "/admin/themes" },
    { label: "Published", value: count((theme) => theme.status === "published"), href: "/admin/themes?status=published" },
    { label: "Under review", value: count((theme) => theme.status === "under_review"), href: "/admin/themes?status=under_review" },
    { label: "Draft", value: count((theme) => theme.status === "draft"), href: "/admin/themes?status=draft" },
    { label: "Unpublished", value: count((theme) => theme.status === "unpublished"), href: "/admin/themes?status=unpublished" },
    { label: "Featured", value: count((theme) => theme.is_featured), href: undefined },
  ];
  const categories = [...new Set(themes.map((theme) => theme.category_name).filter(Boolean) as string[])].sort();

  const search = q?.toLowerCase();
  const visible = themes.filter(
    (theme) =>
      (!status || theme.status === status) &&
      (!category || theme.category_name === category) &&
      (!search || theme.name.toLowerCase().includes(search) || theme.slug.includes(search)),
  );
  // Bulk publishing acts on what the admin is looking at, so a filter narrows it.
  const reviewIds = visible.filter((theme) => theme.status === "under_review").map((theme) => theme.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Themes</h1>
          <p className="mt-1 text-sm text-secondary-text">Upload, review and publish website themes.</p>
        </div>
        <Link href="/admin/themes/new" className={buttonVariants()}>
          <Plus className="size-4" aria-hidden />
          Upload New Theme
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => {
          const content = (
            <>
              <p className="text-xs font-medium text-secondary-text">{stat.label}</p>
              <p className="mt-0.5 font-heading text-xl font-semibold text-navy">{stat.value}</p>
            </>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
              <Card className="h-full px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary-light/40">{content}</Card>
            </Link>
          ) : (
            <Card key={stat.label} className="px-4 py-3">
              {content}
            </Card>
          );
        })}
      </div>

      {reviewIds.length > 0 && (
        <Card className="flex flex-col gap-3 border-primary/30 bg-primary-light/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-foreground">Themes waiting for review</p>
            <p className="text-sm text-secondary-text">Preview them below, then publish them to the marketplace together.</p>
          </div>
          <BulkPublishButton ids={reviewIds} />
        </Card>
      )}

      <form action="/admin/themes" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3 size-4 text-muted-text" aria-hidden />
          <Input name="q" type="search" defaultValue={q} maxLength={80} placeholder="Search by name or slug" aria-label="Search themes" className="pl-9" />
        </div>
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className="h-10 rounded-md border border-border bg-surface px-3 text-sm">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select name="category" defaultValue={category ?? ""} aria-label="Category" className="h-10 rounded-md border border-border bg-surface px-3 text-sm">
          <option value="">All categories</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
        {(q || status || category) && (
          <Link href="/admin/themes" className={buttonVariants({ variant: "ghost" })}>
            Clear
          </Link>
        )}
      </form>

      <p className="text-sm text-secondary-text" aria-live="polite">
        Showing {visible.length} of {themes.length} themes
      </p>

      <Card className="relative overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border text-xs font-semibold text-secondary-text">
            <tr>
              <th scope="col" className="px-4 py-3">Theme</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Version</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Plan</th>
              <th scope="col" className="px-4 py-3">Updated</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((theme) => (
              <tr key={theme.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {theme.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={theme.thumbnail_url} alt="" className="h-10 w-14 rounded-md border border-border object-cover" />
                    ) : (
                      <span className="flex h-10 w-14 items-center justify-center rounded-md bg-primary-light text-primary">
                        <Palette className="size-4" aria-hidden />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {theme.name}
                        {theme.is_featured && <span className="ml-2 text-xs font-medium text-primary-hover">Featured</span>}
                      </p>
                      <p className="text-xs text-secondary-text">{theme.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-secondary-text">{theme.category_name ?? "None"}</td>
                <td className="px-4 py-3 text-secondary-text">{theme.current_version ?? "None"}</td>
                <td className="px-4 py-3"><ThemeStatusBadge status={theme.status} /></td>
                <td className="px-4 py-3 text-secondary-text">{theme.is_premium ? "Premium" : "Free"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-secondary-text">
                  {new Date(theme.updated_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {/* The public preview shows code themes and published uploads. */}
                  {(getThemeDefinitionBySlug(theme.slug) || theme.status === "published") && (
                  <a
                    href={`/preview/themes/${theme.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mr-4 inline-flex items-center gap-1 text-secondary-text hover:text-primary-hover"
                  >
                    Preview
                    <ExternalLink className="size-3.5" aria-hidden />
                    <span className="sr-only">{theme.name} (opens in a new tab)</span>
                  </a>
                  )}
                  <Link href={`/admin/themes/${theme.id}`} className="font-semibold text-primary-hover hover:underline">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-secondary-text">No themes match your filters.</p>
        )}
      </Card>
    </div>
  );
}
