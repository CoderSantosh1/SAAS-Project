import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/features/admin/components/category-form";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage() {
  await requireAdmin("categories.manage");
  return (
    <AdminPage narrow title="New category" back={{ href: "/admin/categories", label: "Categories" }}>
      <CategoryForm />
    </AdminPage>
  );
}
