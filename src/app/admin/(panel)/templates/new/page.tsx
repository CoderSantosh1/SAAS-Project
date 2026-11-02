import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/admin-ui";
import { TemplateForm } from "@/features/admin/components/template-form";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New template" };

export default async function NewTemplatePage() {
  await requireAdmin("templates.manage");
  return (
    <AdminPage narrow title="New template" back={{ href: "/admin/templates", label: "Templates" }}>
      <TemplateForm />
    </AdminPage>
  );
}
