import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminForm, TextareaField } from "@/components/admin/admin-form";
import { AdminPage, formatDate, StatusBadge } from "@/components/admin/admin-ui";
import { Card } from "@/components/ui/card";
import { setWebsiteSuspended } from "@/features/admin/panel-actions";
import { getWebsite } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";
import { can } from "@/lib/permissions";

export const metadata: Metadata = { title: "Website details" };

export default async function AdminWebsitePage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { access } = await requireAdmin("websites.view");
  const { websiteId } = await params;
  if (!z.uuid().safeParse(websiteId).success) notFound();

  const website = await getWebsite(websiteId);
  if (!website) notFound();

  const details = [
    { label: "Web address", value: website.slug },
    { label: "Owner", value: <Link href={`/admin/users/${website.owner_id}`} className="text-primary-hover hover:underline">{website.owner_email}</Link> },
    { label: "Theme", value: website.theme_name ?? "None" },
    { label: "Category", value: website.category_name ?? "None" },
    { label: "Pages", value: website.page_count },
    { label: "Created", value: formatDate(website.created_at) },
    { label: "Last updated", value: formatDate(website.updated_at) },
    { label: "Published", value: formatDate(website.published_at) },
  ];
  const suspended = website.status === "suspended";

  return (
    <AdminPage
      title={website.name}
      back={{ href: "/admin/websites", label: "Websites" }}
      action={
        <div className="flex items-center gap-3">
          <StatusBadge status={website.status} />
          <a href={`/preview/sites/${website.id}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-hover hover:underline">
            Preview draft
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      }
    >
      <Card className="grid gap-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {details.map((detail) => (
          <div key={detail.label}>
            <p className="text-xs text-secondary-text">{detail.label}</p>
            <p className="font-medium break-words">{detail.value}</p>
          </div>
        ))}
        {website.suspended_reason && (
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs text-secondary-text">Suspension reason</p>
            <p className="font-medium">{website.suspended_reason}</p>
          </div>
        )}
      </Card>

      {can(access, "websites.moderate") && (
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Moderation</h2>
          {suspended ? (
            <AdminForm action={setWebsiteSuspended.bind(null, website.id, false)} submitLabel="Restore website">
              <p className="text-sm text-secondary-text">It returns to its earlier state: live if it has a published version, otherwise a draft.</p>
            </AdminForm>
          ) : (
            <AdminForm action={setWebsiteSuspended.bind(null, website.id, true)} submitLabel="Suspend website" submitVariant="danger">
              <p className="text-sm text-secondary-text">Its live version goes offline. The owner&apos;s content is kept.</p>
              <TextareaField label="Reason (recorded in the activity log)" name="reason" maxLength={500} />
            </AdminForm>
          )}
        </Card>
      )}
    </AdminPage>
  );
}
