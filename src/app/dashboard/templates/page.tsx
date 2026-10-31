import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { ThemeGrid } from "@/components/public/theme-card";
import { PageTitle } from "@/components/user/page-title";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listCategories, listTemplates, type MarketplaceTemplate } from "@/features/marketplace/queries";
import { listPopularThemeSlugs } from "@/features/websites/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Templates" };

const filtersSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().regex(/^[a-z0-9-]+$/).max(80).optional().catch(undefined),
});

const useTemplateHref = (template: MarketplaceTemplate) =>
  `/dashboard/create-website?theme=${template.theme_slug}`;

export default async function DashboardTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const { q, category } = filtersSchema.parse(await searchParams);
  const filtering = Boolean(q || category);

  const [templates, categories, popularSlugs] = await Promise.all([
    listTemplates({ search: q, categorySlug: category }),
    listCategories(),
    filtering ? Promise.resolve([]) : listPopularThemeSlugs(),
  ]);

  const options = categories.filter(
    (option) => Number(option.template_count) > 0 || option.slug === category,
  );
  const featured = filtering ? [] : templates.filter((template) => template.is_featured);
  const popular = popularSlugs.flatMap((slug) => templates.filter((template) => template.theme_slug === slug));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageTitle title="Templates" description="Pick a design and start building." />

      <form action="/dashboard/templates" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3 size-4 text-muted-text" aria-hidden />
          <Input name="q" type="search" defaultValue={q} placeholder="Search templates" aria-label="Search templates" className="pl-9" maxLength={80} />
        </div>
        <select
          name="category"
          defaultValue={category ?? ""}
          aria-label="Category"
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
        >
          <option value="">All categories</option>
          {options.map((option) => (
            <option key={option.id} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      {popular.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Popular</h2>
          <ThemeGrid templates={popular} hrefFor={useTemplateHref} />
        </section>
      )}

      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Featured</h2>
          <ThemeGrid templates={featured} hrefFor={useTemplateHref} />
        </section>
      )}

      {templates.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-semibold">No templates found</h2>
          <Link href="/dashboard/templates" className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
            Clear filters
          </Link>
        </Card>
      ) : (
        <section>
          {!filtering && <h2 className="mb-4 text-xl font-semibold">All templates</h2>}
          <ThemeGrid templates={templates} hrefFor={useTemplateHref} />
        </section>
      )}
    </div>
  );
}
