import type { Metadata } from "next";
import { CategoryGrid } from "@/components/public/category-grid";
import { PageHeader, PUBLIC_CONTAINER } from "@/components/public/page-header";
import { listCategories } from "@/features/marketplace/queries";

export const metadata: Metadata = {
  title: "Categories",
  description: "Website templates for every kind of business.",
};
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className={`${PUBLIC_CONTAINER} py-14 sm:py-20`}>
      <PageHeader title="Categories" description="Choose your field to see templates made for it." />
      <div className="mt-10">
        <CategoryGrid categories={categories} />
      </div>
    </div>
  );
}
