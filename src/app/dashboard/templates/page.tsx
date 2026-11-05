import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { CategoryChips, paginate, Pagination, TemplateSearch } from "@/components/public/template-browse";
import { ThemeGrid } from "@/components/public/theme-card";
import { PageTitle } from "@/components/user/page-title";
import { Card } from "@/components/ui/card";
import { listCategories, listTemplates, type MarketplaceTemplate } from "@/features/marketplace/queries";
import { listPopularThemeSlugs } from "@/features/websites/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Templates" };

const filtersSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().regex(/^[a-z0-9-]+$/).max(80).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
});

const useTemplateHref = (template: MarketplaceTemplate) =>
  `/dashboard/create-website?theme=${template.theme_slug}`;

export default async function DashboardTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const { q, category, page } = filtersSchema.parse(await searchParams);
  const filtering = Boolean(q || category);
  // Popular and featured rows show only on the first, unfiltered page.
  const showHighlights = !filtering && (page ?? 1) === 1;

  const [templates, categories, popularSlugs, all] = await Promise.all([
    listTemplates({ search: q, categorySlug: category }),
    listCategories(),
    showHighlights ? listPopularThemeSlugs() : Promise.resolve([]),
    filtering ? listTemplates() : null,
  ]);

  const featured = showHighlights ? templates.filter((template) => template.is_featured).slice(0, 6) : [];
  const popular = popularSlugs.flatMap((slug) => templates.filter((template) => template.theme_slug === slug));
  const current = paginate(templates, page ?? 1);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageTitle title="Templates" description="Pick a design made for your business and start building. You can change everything later." />

      <div className="space-y-4">
        <TemplateSearch basePath="/dashboard/templates" q={q} category={category} />
        <CategoryChips basePath="/dashboard/templates" categories={categories} q={q} category={category} total={(all ?? templates).length} />
      </div>

      {popular.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Popular</h2>
          <ThemeGrid templates={popular} hrefFor={useTemplateHref} cta="Use this template" withPreviewLink />
        </section>
      )}

      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Featured</h2>
          <ThemeGrid templates={featured} hrefFor={useTemplateHref} cta="Use this template" withPreviewLink />
        </section>
      )}

      {templates.length === 0 ? (
        <Card className="p-10 text-center">
          <h2 className="text-lg font-semibold">No templates found</h2>
          <p className="mt-1 text-sm text-secondary-text">Try a different search or category.</p>
          <Link href="/dashboard/templates" className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
            Clear filters
          </Link>
        </Card>
      ) : (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold">{filtering ? "Results" : "All templates"}</h2>
            <p className="text-sm text-secondary-text" aria-live="polite">
              {templates.length} {templates.length === 1 ? "template" : "templates"}
            </p>
          </div>
          <ThemeGrid templates={current.items} hrefFor={useTemplateHref} cta="Use this template" withPreviewLink />
          <Pagination basePath="/dashboard/templates" filters={{ q, category }} page={current.page} pageCount={current.pageCount} />
        </section>
      )}
    </div>
  );
}
