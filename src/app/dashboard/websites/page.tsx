import { Globe, Plus, Search, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTitle } from "@/components/user/page-title";
import { WebsiteCard } from "@/components/user/website-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { countByTab, filterWebsites, WEBSITE_TABS } from "@/features/websites/filter";
import { listMyWebsites } from "@/features/websites/queries";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Websites" };

const filtersSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  status: z.enum(["all", "published", "draft", "unpublished"]).optional().catch(undefined),
});

function tabHref(status: string, q?: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  const query = params.toString();
  return `/dashboard/websites${query ? `?${query}` : ""}`;
}

export default async function MyWebsitesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const { q, status = "all" } = filtersSchema.parse(await searchParams);
  const websites = await listMyWebsites();
  const counts = countByTab(websites);
  const visible = filterWebsites(websites, { q, status });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTitle
        title="My Websites"
        description="Everything you have built, in one place."
        action={
          <Link href="/dashboard/create-website" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden />
            Create Website
          </Link>
        }
      />

      {websites.length === 0 ? (
        <Card>
          <EmptyState
            icon={Globe}
            title="You have no websites yet"
            text="Choose a template and your first website will be ready in about a minute."
            action={
              <Link href="/dashboard/create-website" className={buttonVariants()}>
                Create your first website
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <ul className="flex w-max gap-1 rounded-lg border border-border bg-surface p-1 shadow-card">
                {WEBSITE_TABS.map((tab) => {
                  const active = tab.value === status;
                  return (
                    <li key={tab.value}>
                      <Link
                        href={tabHref(tab.value, q)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                          active ? "bg-primary text-white shadow-sm" : "text-secondary-text hover:bg-background hover:text-foreground",
                        )}
                      >
                        {tab.label}
                        <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-white/20" : "bg-background")}>{counts[tab.value]}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <form action="/dashboard/websites" role="search" className="flex gap-2 lg:w-80">
              {status !== "all" && <input type="hidden" name="status" value={status} />}
              <div className="relative flex-1">
                <Search className="absolute top-3 left-3 size-4 text-muted-text" aria-hidden />
                <Input name="q" type="search" defaultValue={q} maxLength={80} placeholder="Search your websites" aria-label="Search your websites" className="pl-9" />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
          </div>

          {visible.length === 0 ? (
            <Card>
              <EmptyState
                icon={SearchX}
                title="No websites match"
                text="Try a different search or status."
                action={
                  <Link href="/dashboard/websites" className={buttonVariants({ variant: "secondary" })}>
                    Show all websites
                  </Link>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((website) => (
                <WebsiteCard key={website.id} website={website} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
