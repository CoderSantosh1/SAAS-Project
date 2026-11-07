import { FilePen, Globe, HardDrive, Rocket, UserCheck, Users, UserX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage, StatRow } from "@/components/admin/admin-ui";
import { Card } from "@/components/ui/card";
import { TrendChart } from "@/features/admin/components/analytics-charts";
import { getAnalytics } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Analytics" };

const RANGES = [7, 30, 90, 365];

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function Ranking({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.count)));
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-secondary-text">No websites yet.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.name} className="text-sm">
              <div className="mb-1 flex justify-between gap-3">
                <span>{row.name}</span>
                <span className="font-semibold">{row.count}</span>
              </div>
              <div className="h-2 rounded-full bg-background">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${(Number(row.count) / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin("analytics.view");
  const requested = Number((await searchParams).days);
  const days = RANGES.includes(requested) ? requested : 30;
  const data = await getAnalytics(days);
  const sum = (key: "users" | "websites" | "published") => data.series.reduce((total, day) => total + Number(day[key]), 0);

  return (
    <AdminPage
      title="Analytics"
      description="Live figures from the platform database."
      action={
        <div role="group" aria-label="Date range" className="flex rounded-md border border-border bg-surface text-sm font-medium">
          {RANGES.map((range) => (
            <Link key={range} href={`/admin/analytics?days=${range}`} aria-current={range === days ? "true" : undefined} className={`px-3 py-2 ${range === days ? "bg-primary-light text-primary-hover" : "text-secondary-text"}`}>
              {range === 365 ? "1 year" : `${range} days`}
            </Link>
          ))}
        </div>
      }
    >
      <StatRow stats={[
        { label: "Registered users", icon: Users, value: data.totals.users },
        { label: "Active accounts", icon: UserCheck, value: data.totals.active_users },
        { label: "Users with a website", icon: Globe, value: data.totals.users_with_website },
        { label: "Suspended", icon: UserX, value: data.totals.suspended_users },
        { label: "Total websites", icon: Globe, value: data.totals.websites },
        { label: "Published", icon: Rocket, value: data.totals.published },
        { label: "Drafts", icon: FilePen, value: data.totals.drafts },
        { label: "Storage used", icon: HardDrive, value: formatBytes(Number(data.totals.storage_bytes)) },
      ]} />

      <div className="grid gap-4 lg:grid-cols-3">
        <TrendChart title="New users" total={sum("users")} data={data.series} dataKey="users" />
        <TrendChart title="Websites created" total={sum("websites")} data={data.series} dataKey="websites" />
        <TrendChart title="Websites published" total={sum("published")} data={data.series} dataKey="published" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Ranking title="Popular themes" rows={data.popular_themes} />
        <Ranking title="Popular categories" rows={data.popular_categories} />
      </div>

      <details className="rounded-lg border border-border bg-surface p-4 text-sm">
        <summary className="cursor-pointer font-semibold">View daily numbers as a table</summary>
        <div className="mt-3 max-h-72 overflow-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-secondary-text">
              <tr><th className="py-1">Date</th><th>New users</th><th>Websites created</th><th>Published</th></tr>
            </thead>
            <tbody>
              {data.series.map((day) => (
                <tr key={day.date} className="border-t border-border">
                  <td className="py-1">{day.date}</td><td>{day.users}</td><td>{day.websites}</td><td>{day.published}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="text-sm text-secondary-text">
        Visitor traffic is not shown, because the platform does not record page visits yet. &quot;Active accounts&quot; means not suspended, not recently signed in.
      </p>
    </AdminPage>
  );
}
