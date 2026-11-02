import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage, DataTable, StatusBadge, Td } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { buttonVariants } from "@/components/ui/button";
import { deleteTemplate } from "@/features/admin/panel-actions";
import { listTemplates } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Templates" };

export default async function AdminTemplatesPage() {
  await requireAdmin("templates.manage");
  const templates = await listTemplates();

  return (
    <AdminPage
      title="Templates"
      description="Marketplace listings. Each one is built on an approved theme."
      action={<Link href="/admin/templates/new" className={buttonVariants()}><Plus className="size-4" aria-hidden />New template</Link>}
    >
      <DataTable headers={["Order", "Template", "Theme", "Status", "Visible", "Websites", ""]} isEmpty={templates.length === 0} empty="No templates yet.">
        {templates.map((template) => (
          <tr key={template.id}>
            <Td>{template.display_order}</Td>
            <Td>
              <p className="font-semibold text-foreground">
                {template.name}
                {template.is_featured && <span className="ml-2 text-xs font-medium text-primary-hover">Featured</span>}
              </p>
              <p className="text-xs">{template.slug}</p>
            </Td>
            <Td>
              {template.theme_name}
              {template.theme_status !== "published" && <p className="text-xs text-amber-800">Theme not published, so this stays hidden.</p>}
            </Td>
            <Td><StatusBadge status={template.status} /></Td>
            <Td>{template.is_visible ? "Yes" : "No"}</Td>
            <Td>{template.website_count}</Td>
            <Td className="text-right whitespace-nowrap">
              <Link href={`/admin/templates/${template.id}`} className="mr-3 font-semibold text-primary-hover hover:underline">Edit</Link>
              <ConfirmAction
                triggerClassName="font-semibold text-danger hover:underline"
                trigger="Delete"
                title={`Delete ${template.name}?`}
                description="It leaves the marketplace. Websites built from it keep working."
                confirmLabel="Delete template"
                action={deleteTemplate.bind(null, template.id)}
              />
            </Td>
          </tr>
        ))}
      </DataTable>
    </AdminPage>
  );
}
