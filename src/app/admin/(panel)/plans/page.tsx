import type { Metadata } from "next";
import { AdminForm, CheckField, Field, TextareaField } from "@/components/admin/admin-form";
import { AdminPage, StatusBadge } from "@/components/admin/admin-ui";
import { Card } from "@/components/ui/card";
import { savePlan } from "@/features/admin/panel-actions";
import { listPlans, type AdminPlan } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Plans and Pricing" };

function PlanFields({ plan }: { plan?: AdminPlan }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name" name="name" required defaultValue={plan?.name} />
        <Field label="Slug" name="slug" required defaultValue={plan?.slug} />
        <Field label="Monthly price (₹)" name="price_rupees" type="number" min={0} step="0.01" required defaultValue={plan ? plan.monthly_price_paise / 100 : 0} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Websites" name="website_limit" type="number" min={0} placeholder="No limit" defaultValue={plan?.website_limit ?? ""} />
          <Field label="Storage (MB)" name="storage_limit_mb" type="number" min={0} placeholder="No limit" defaultValue={plan?.storage_limit_mb ?? ""} />
        </div>
      </div>
      <TextareaField label="Features shown on the pricing page" name="features" hint="One on each line." defaultValue={plan?.features.join("\n") ?? ""} />
      <div className="flex flex-wrap gap-6">
        <CheckField label="Custom domains" name="custom_domains" defaultChecked={plan?.custom_domains} />
        <CheckField label="Premium themes" name="premium_themes" defaultChecked={plan?.premium_themes} />
        <CheckField label="Show on the pricing page" name="is_active" defaultChecked={plan?.is_active} />
      </div>
    </>
  );
}

export default async function AdminPlansPage() {
  await requireAdmin("plans.manage");
  const plans = await listPlans();

  return (
    <AdminPage narrow title="Plans and Pricing" description="Decide what the pricing page offers.">
      <p role="note" className="rounded-md bg-warning/15 px-4 py-3 text-sm text-amber-900">
        Payments are not built yet, and limits here are not enforced yet. Showing a paid plan will not let anyone buy it, so keep paid plans off during the free launch.
      </p>
      {plans.map((plan) => (
        <Card key={plan.id} className="p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold">{plan.name}</h2>
            <StatusBadge status={plan.is_active ? "active" : "draft"} />
          </div>
          <AdminForm action={savePlan.bind(null, plan.id)} submitLabel={`Save ${plan.name}`} submitVariant="secondary">
            <PlanFields plan={plan} />
          </AdminForm>
        </Card>
      ))}
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Add a plan</h2>
        <AdminForm action={savePlan.bind(null, null)} submitLabel="Add plan" submitVariant="secondary" resetOnSuccess>
          <PlanFields />
        </AdminForm>
      </Card>
    </AdminPage>
  );
}
