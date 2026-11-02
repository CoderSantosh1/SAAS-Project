import { AdminForm, CheckField, Field, ImageUploadField, SelectField, TextareaField } from "@/components/admin/admin-form";
import { Card } from "@/components/ui/card";
import { saveCategory } from "../panel-actions";
import type { AdminCategory } from "../panel-queries";

export const PUBLISH_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function CategoryForm({ category }: { category?: AdminCategory }) {
  return (
    <Card className="p-6">
      <AdminForm action={saveCategory.bind(null, category?.id ?? null)} submitLabel="Save category">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" name="name" required defaultValue={category?.name} />
          <Field label="Slug" name="slug" required defaultValue={category?.slug} hint="Lowercase letters, numbers and hyphens." />
        </div>
        <TextareaField label="Description" name="description" maxLength={500} defaultValue={category?.description ?? ""} />
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Icon" name="icon" defaultValue={category?.icon ?? ""} hint="A Lucide icon name, like coffee." />
          <SelectField label="Status" name="status" defaultValue={category?.status ?? "draft"} options={PUBLISH_OPTIONS} />
          <Field label="Display order" name="display_order" type="number" min={0} defaultValue={category?.display_order ?? 0} />
        </div>
        <ImageUploadField label="Thumbnail" name="thumbnail_url" folder="categories" defaultValue={category?.thumbnail_url} />
        <CheckField label="Featured" name="is_featured" defaultChecked={category?.is_featured} />
      </AdminForm>
    </Card>
  );
}
