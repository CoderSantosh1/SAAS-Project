import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { getAdminOverviewStats } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const { access } = await requireAdmin();
  const stats = await getAdminOverviewStats(access);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform overview</h1>
        <p className="mt-1 text-sm text-secondary-text">Live counts from the platform database.</p>
      </div>

      {stats.length === 0 ? (
        <Card className="p-6 text-sm text-secondary-text">
          Your role has no statistics to show.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="px-5 py-4">
              <p className="text-xs font-medium tracking-wide text-secondary-text uppercase">
                {stat.label}
              </p>
              <p className="mt-1 font-heading text-2xl font-semibold text-navy">{stat.value}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
