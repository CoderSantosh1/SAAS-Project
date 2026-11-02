import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-ui";
import { TemplateForm } from "@/features/admin/components/template-form";
import { listTemplates } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit template" };

export default async function EditTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  await requireAdmin("templates.manage");
  const { templateId } = await params;
  const template = (await listTemplates()).find((candidate) => candidate.id === templateId);
  if (!template) notFound();

  return (
    <AdminPage narrow title={template.name} back={{ href: "/admin/templates", label: "Templates" }}>
      <TemplateForm template={template} />
    </AdminPage>
  );
}
