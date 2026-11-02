import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage, DataTable, StatRow, StatusBadge, Td } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { buttonVariants } from "@/components/ui/button";
import { deleteCategory } from "@/features/admin/panel-actions";
import { listCategories } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requireAdmin("categories.manage");
  const categories = await listCategories();
  const count = (status: string) => categories.filter((category) => category.status === status).length;

  return (
    <AdminPage
      title="Categories"
      description="Control what appears in the marketplace and the website wizard."
      action={<Link href="/admin/categories/new" className={buttonVariants()}><Plus className="size-4" aria-hidden />New category</Link>}
    >
      <StatRow stats={[
        { label: "Total", value: categories.length },
        { label: "Published", value: count("published") },
        { label: "Draft", value: count("draft") },
        { label: "Featured", value: categories.filter((category) => category.is_featured).length },
      ]} />
      <DataTable headers={["Order", "Category", "Status", "Themes", "Websites", ""]} isEmpty={categories.length === 0} empty="No categories yet.">
        {categories.map((category) => (
          <tr key={category.id}>
            <Td>{category.display_order}</Td>
            <Td>
              <p className="font-semibold text-foreground">
                {category.name}
                {category.is_featured && <span className="ml-2 text-xs font-medium text-primary-hover">Featured</span>}
              </p>
              <p className="text-xs">{category.slug}</p>
            </Td>
            <Td><StatusBadge status={category.status} /></Td>
            <Td>{category.theme_count}</Td>
            <Td>{category.website_count}</Td>
            <Td className="text-right whitespace-nowrap">
              <Link href={`/admin/categories/${category.id}`} className="mr-3 font-semibold text-primary-hover hover:underline">Edit</Link>
              <ConfirmAction
                triggerClassName="font-semibold text-danger hover:underline"
                trigger="Delete"
                title={`Delete ${category.name}?`}
                description="This is refused if themes, templates or websites use it. Archive it instead in that case."
                confirmLabel="Delete category"
                action={deleteCategory.bind(null, category.id)}
              />
            </Td>
          </tr>
        ))}
      </DataTable>
    </AdminPage>
  );
}
