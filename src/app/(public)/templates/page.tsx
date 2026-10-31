import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { PageHeader, PUBLIC_CONTAINER } from "@/components/public/page-header";
import { ThemeGrid } from "@/components/public/theme-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listCategories, listTemplates } from "@/features/marketplace/queries";

export const metadata: Metadata = {
  title: "Templates",
  description: "Browse professionally designed website templates.",
};

const filtersSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().regex(/^[a-z0-9-]+$/).max(80).optional().catch(undefined),
});

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { q, category } = filtersSchema.parse(await searchParams);

  const [templates, categories] = await Promise.all([
    listTemplates({ search: q, categorySlug: category }),
    listCategories(),
  ]);
  const options = categories.filter(
    (option) => Number(option.template_count) > 0 || option.slug === category,
  );

  return (
    <div className={`${PUBLIC_CONTAINER} py-14 sm:py-20`}>
      <PageHeader title="Templates" description="Find a starting point for your website. You can change everything later." />

      {/* A plain GET form, so filtering works without JavaScript and results can be linked to. */}
      <form action="/templates" className="mt-8 flex flex-col gap-3 sm:flex-row">
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

      <div className="mt-8">
        {templates.length > 0 ? (
          <ThemeGrid templates={templates} />
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
