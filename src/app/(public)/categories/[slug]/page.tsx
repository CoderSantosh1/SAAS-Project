import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PageHeader, PUBLIC_CONTAINER } from "@/components/public/page-header";
import { ThemeGrid } from "@/components/public/theme-card";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listCategories, listTemplates } from "@/features/marketplace/queries";

const getCategory = cache(async (slug: string) => {
  const categories = await listCategories();
  return categories.find((category) => category.slug === slug) ?? null;
});

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  return category
    ? { title: `${category.name} templates`, description: category.description ?? undefined }
    : { title: "Category not found" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const templates = await listTemplates({ categorySlug: slug });

  return (
    <div className={`${PUBLIC_CONTAINER} py-14 sm:py-20`}>
      <Link href="/categories" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-secondary-text hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        All categories
      </Link>
      <PageHeader title={`${category.name} templates`} description={category.description} />
      <div className="mt-10">
        {templates.length > 0 ? (
          <ThemeGrid templates={templates} />
        ) : (
          <Card className="p-10 text-center">
            <h2 className="text-lg font-semibold">No templates here yet</h2>
            <p className="mt-1 text-sm text-secondary-text">
              We are still designing for {category.name}. Any of our templates can be adapted in the meantime.
            </p>
            <Link href="/templates" className={`${buttonVariants({ variant: "secondary" })} mt-5`}>
              Browse all templates
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
