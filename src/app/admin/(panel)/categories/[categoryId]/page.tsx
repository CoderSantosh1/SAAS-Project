import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/features/admin/components/category-form";
import { listCategories } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  await requireAdmin("categories.manage");
  const { categoryId } = await params;
  const category = (await listCategories()).find((candidate) => candidate.id === categoryId);
  if (!category) notFound();

  return (
    <AdminPage narrow title={category.name} back={{ href: "/admin/categories", label: "Categories" }}>
      <CategoryForm category={category} />
    </AdminPage>
  );
}
