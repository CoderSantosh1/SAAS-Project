import { AdminForm, CheckField, Field, SelectField, TextareaField } from "@/components/admin/admin-form";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { listAdminThemes } from "@/features/themes/queries";
import { listCategoryOptions } from "@/features/themes/queries";
import { saveTemplate } from "../panel-actions";
import type { AdminTemplate } from "../panel-queries";
import { PUBLISH_OPTIONS } from "./category-form";

export async function TemplateForm({ template }: { template?: AdminTemplate }) {
  const { access } = await requireAdmin("templates.manage");
  // Choosing a theme needs the theme list, which belongs to another permission.
  const canListThemes = access.isSuper || access.permissions.includes("themes.manage");
  const [themes, categories] = await Promise.all([canListThemes ? listAdminThemes() : Promise.resolve([]), listCategoryOptions()]);

  const options = themes.map((theme) => ({ value: theme.id, label: `${theme.name} (${theme.status.replaceAll("_", " ")})` }));
  if (template && !options.some((option) => option.value === template.theme_id)) {
    options.unshift({ value: template.theme_id, label: template.theme_name });
  }

  return (
    <Card className="p-6">
      <AdminForm action={saveTemplate.bind(null, template?.id ?? null)} submitLabel="Save template">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" name="name" required defaultValue={template?.name} />
          <Field label="Slug" name="slug" required defaultValue={template?.slug} hint="Lowercase letters, numbers and hyphens." />
        </div>
        <TextareaField label="Description" name="description" maxLength={500} defaultValue={template?.description ?? ""} />
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label="Theme" name="theme_id" required defaultValue={template?.theme_id ?? ""} options={[{ value: "", label: "Choose a theme" }, ...options]} />
          <SelectField label="Status" name="status" defaultValue={template?.status ?? "draft"} options={PUBLISH_OPTIONS} />
          <Field label="Display order" name="display_order" type="number" min={0} defaultValue={template?.display_order ?? 0} />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Categories</legend>
          <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border p-3 md:grid-cols-3">
            {categories.map((category) => (
              <CheckField key={category.id} label={category.name} name="categories" value={category.id} defaultChecked={template?.category_ids.includes(category.id)} />
            ))}
          </div>
        </fieldset>
        <TextareaField
          label="Preview image addresses"
          name="preview_images"
          hint="One https:// address on each line. Copy them from the Media Library."
          defaultValue={template?.preview_images.join("\n") ?? ""}
        />
        <div className="flex flex-wrap gap-6">
          <CheckField label="Featured" name="is_featured" defaultChecked={template?.is_featured} />
          <CheckField label="Visible" name="is_visible" defaultChecked={template?.is_visible ?? true} />
        </div>
      </AdminForm>
    </Card>
  );
}
