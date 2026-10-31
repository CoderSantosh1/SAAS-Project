import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageTitle } from "@/components/user/page-title";
import { Card } from "@/components/ui/card";
import { WebsiteSettingsForm } from "@/features/websites/components/website-settings-form";
import { getMyWebsite } from "@/features/websites/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Website settings" };

export default async function WebsiteSettingsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const profile = await requireUser();
  const { websiteId } = await params;
  if (!z.uuid().safeParse(websiteId).success) notFound();

  const website = await getMyWebsite(websiteId, profile.id);
  if (!website) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/dashboard/websites" className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-text hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        My Websites
      </Link>
      <PageTitle title="Website settings" description={website.name} />
      <Card className="p-6">
        <WebsiteSettingsForm website={website} />
      </Card>
    </div>
  );
}
