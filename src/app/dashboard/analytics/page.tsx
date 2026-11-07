import { BarChart3, Eye, FileText, Globe, TrendingDown, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StatCard, StatusBadge, type Stat } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTitle } from "@/components/user/page-title";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendChart } from "@/features/admin/components/analytics-charts";
import { getMyAnalytics } from "@/features/analytics/queries";
import { pageLabel, PERIODS, trendLabel } from "@/features/analytics/summary";
import { liveSitePath } from "@/features/websites/urls";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

const filtersSchema = z.object({
  days: z.coerce.number().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])).optional().catch(undefined),
  website: z.uuid().optional().catch(undefined),
});

function href(days: number, website?: string) {
  const params = new URLSearchParams();
  if (days !== 30) params.set("days", String(days));
  if (website) params.set("website", website);
  const query = params.toString();
  return `/dashboard/analytics${query ? `?${query}` : ""}`;
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const { days = 30, website } = filtersSchema.parse(await searchParams);
  const [data, all] = await Promise.all([getMyAnalytics(days, website), website ? getMyAnalytics(days) : null]);
  if (!data) notFound();
  const websites = (all ?? data).websites;
  const selected = websites.find((candidate) => candidate.id === website);
  const trend = trendLabel(data.total, data.previous_total);
  const live = websites.filter((candidate) => candidate.status === "published").length;
  const topPage = data.pages[0];

  const stats: Stat[] = [
    { label: `Visits, last ${days} days`, value: data.total.toLocaleString("en-IN"), icon: Eye, hint: trend.label },
    { label: "Daily average", value: Math.round(data.total / data.days).toLocaleString("en-IN"), icon: BarChart3 },
    {
      label: "Most visited page",
      value: topPage ? pageLabel(topPage.page_slug) : "None yet",
      icon: FileText,
      hint: topPage ? `${topPage.views.toLocaleString("en-IN")} visits` : undefined,
    },
    { label: "Live websites", value: `${live} of ${websites.length}`, icon: Globe, href: "/dashboard/websites?status=published" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTitle title="Analytics" description={selected ? `Visits to ${selected.name}.` : "Visits to all your live websites."} />

      {websites.length === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No websites yet"
            text="Publish a website and its visits will appear here."
            action={
              <Link href="/dashboard/create-website" className={buttonVariants()}>
                Create a website
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Period" className="flex w-max gap-1 rounded-lg border border-border bg-surface p-1 shadow-card">
              {PERIODS.map((period) => (
                <Link
                  key={period}
                  href={href(period, website)}
                  aria-current={period === days ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium",
                    period === days ? "bg-primary text-white shadow-sm" : "text-secondary-text hover:bg-background hover:text-foreground",
                  )}
                >
                  {period} days
                </Link>
              ))}
            </nav>
            <form action="/dashboard/analytics" className="flex gap-2">
              {days !== 30 && <input type="hidden" name="days" value={days} />}
              <select name="website" defaultValue={website ?? ""} aria-label="Website" className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
                <option value="">All websites</option>
                {websites.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={buttonVariants({ variant: "secondary" })}>
                Show
              </button>
            </form>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>

          {data.total === 0 && live === 0 && (
            <Card className="flex flex-col gap-3 border-primary/25 bg-primary-light p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-foreground">Visits are counted once a website is live. Publish one from My Websites or the editor.</p>
              <Link href="/dashboard/websites" className={buttonVariants()}>
                Go to My Websites
              </Link>
            </Card>
          )}

          <p className="flex items-center gap-2 text-sm text-secondary-text">
            {trend.direction === "down" ? <TrendingDown className="size-4 text-amber-600" aria-hidden /> : <TrendingUp className="size-4 text-green-600" aria-hidden />}
            {trend.label}
          </p>

          <TrendChart title="Visits per day" total={data.total} data={data.daily.map((row) => ({ date: row.day, views: row.views }))} dataKey="views" />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-sm font-semibold">Top pages</h2>
              {data.pages.length === 0 ? (
                <p className="mt-4 text-sm text-secondary-text">No visits in this period.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {data.pages.map((page) => (
                    <li key={page.page_slug} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">{pageLabel(page.page_slug)}</span>
                        <span className="text-secondary-text tabular-nums">{page.views.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-background">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (page.views / data.pages[0]!.views) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-semibold">By website</h2>
              <ul className="mt-4 divide-y divide-border">
                {websites.map((candidate) => (
                  <li key={candidate.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <Link href={href(days, candidate.id)} className="block truncate font-medium text-foreground hover:text-primary-hover">
                        {candidate.name}
                      </Link>
                      {candidate.status === "published" ? (
                        <a href={liveSitePath(candidate.slug)} target="_blank" rel="noopener" className="text-xs text-secondary-text hover:underline">
                          {liveSitePath(candidate.slug)}
                        </a>
                      ) : (
                        <span className="text-xs text-secondary-text">Not live</span>
                      )}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-secondary-text tabular-nums">{candidate.views.toLocaleString("en-IN")}</span>
                      <StatusBadge status={candidate.status} />
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <p className="text-xs text-secondary-text">Visits are counted per page, per day. We never store who visited, so your visitors stay private.</p>
        </>
      )}
    </div>
  );
}
