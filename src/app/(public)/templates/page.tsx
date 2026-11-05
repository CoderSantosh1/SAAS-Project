import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { PageHeader, PUBLIC_CONTAINER } from "@/components/public/page-header";
import { CategoryChips, paginate, Pagination, TemplateSearch } from "@/components/public/template-browse";
import { ThemeGrid } from "@/components/public/theme-card";
import { Card } from "@/components/ui/card";
import { listCategories, listTemplates } from "@/features/marketplace/queries";

export const metadata: Metadata = {
  title: "Templates",
  description: "Browse professionally designed website templates for every kind of business.",
};

const filtersSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().regex(/^[a-z0-9-]+$/).max(80).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
});

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { q, category, page } = filtersSchema.parse(await searchParams);

  const [templates, categories, all] = await Promise.all([
    listTemplates({ search: q, categorySlug: category }),
    listCategories(),
    q || category ? listTemplates() : null,
  ]);
  const current = paginate(templates, page ?? 1);
  const selected = categories.find((option) => option.slug === category);

  return (
    <div className={`${PUBLIC_CONTAINER} py-14 sm:py-20`}>
      <PageHeader
        title={selected ? `${selected.name} templates` : "Website templates"}
        description="Pick a design made for your business. Change the text, images, colors and pages any time."
      />

      <div className="mt-8 space-y-4">
        <TemplateSearch basePath="/templates" q={q} category={category} />
        <CategoryChips basePath="/templates" categories={categories} q={q} category={category} total={(all ?? templates).length} />
      </div>

      <div className="mt-8 space-y-8">
        {templates.length > 0 ? (
          <>
            <p className="text-sm text-secondary-text" aria-live="polite">
              {templates.length} {templates.length === 1 ? "template" : "templates"}
              {q && <> matching &ldquo;{q}&rdquo;</>}
            </p>
            <ThemeGrid templates={current.items} />
            <Pagination basePath="/templates" filters={{ q, category }} page={current.page} pageCount={current.pageCount} />
          </>
        ) : (
          <Card className="p-10 text-center">
            <h2 className="text-lg font-semibold">No templates found</h2>
            <p className="mt-1 text-sm text-secondary-text">Try a different search or category.</p>
            <Link href="/templates" className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover">
              Clear filters
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
