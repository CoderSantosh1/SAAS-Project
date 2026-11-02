import type { Metadata } from "next";
import { AdminForm, CheckField, Field, ImageUploadField, TextareaField } from "@/components/admin/admin-form";
import { AdminPage } from "@/components/admin/admin-ui";
import { Card } from "@/components/ui/card";
import { saveSettings } from "@/features/admin/panel-actions";
import { getPlatformSettings } from "@/features/settings/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Platform Settings" };

export default async function AdminSettingsPage() {
  await requireAdmin("settings.manage");
  const settings = await getPlatformSettings();
  const social = (label: string) => settings.social.find((link) => link.label === label)?.url ?? "";

  return (
    <AdminPage narrow title="Platform Settings" description="These apply to the public site as soon as you save.">
      <AdminForm action={saveSettings} submitLabel="Save settings" className="space-y-5">
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Brand</h2>
          <Field label="Platform name" name="name" required maxLength={60} defaultValue={settings.name} />
          <div className="grid gap-4 md:grid-cols-2">
            <ImageUploadField label="Logo" name="logo_url" folder="settings" defaultValue={settings.logoUrl} />
            <ImageUploadField label="Favicon" name="favicon_url" folder="settings" defaultValue={settings.faviconUrl} />
          </div>
        </Card>
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">SEO defaults</h2>
          <Field label="Default page title" name="seo_title" maxLength={120} defaultValue={settings.seoTitle} />
          <TextareaField label="Default description" name="seo_description" maxLength={300} defaultValue={settings.seoDescription} />
        </Card>
        <Card className="space-y-4 p-5">
          <h2 className="font-semibold">Contact and social links</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contact email" name="contact_email" type="email" defaultValue={settings.contactEmail} />
            <Field label="Contact phone" name="contact_phone" maxLength={30} defaultValue={settings.contactPhone} />
            <Field label="Facebook" name="facebook" placeholder="https://" defaultValue={social("Facebook")} />
            <Field label="Instagram" name="instagram" placeholder="https://" defaultValue={social("Instagram")} />
            <Field label="X" name="x" placeholder="https://" defaultValue={social("X")} />
            <Field label="LinkedIn" name="linkedin" placeholder="https://" defaultValue={social("LinkedIn")} />
          </div>
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">Access</h2>
          <CheckField label="Allow new registrations" name="registrations_open" defaultChecked={settings.registrationsOpen} />
          <CheckField label="Maintenance mode (public pages show a notice, and admin keeps working)" name="maintenance_mode" defaultChecked={settings.maintenanceMode} />
        </Card>
      </AdminForm>
      <p className="text-sm text-secondary-text">
        Sign-up and password emails are configured in the Supabase dashboard, under Authentication.
      </p>
    </AdminPage>
  );
}
