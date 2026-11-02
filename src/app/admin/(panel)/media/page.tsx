import type { Metadata } from "next";
import { z } from "zod";
import { AdminPage, FilterBar } from "@/components/admin/admin-ui";
import { Card } from "@/components/ui/card";
import { PlatformMediaCard, PlatformMediaUploader } from "@/features/admin/components/platform-media";
import { listMedia } from "@/features/admin/panel-queries";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Media Library" };

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin("media.manage");
  const q = z.string().trim().max(80).optional().catch(undefined).parse((await searchParams).q);
  const assets = await listMedia(q);

  return (
    <AdminPage title="Media Library" description="Platform logos, banners and marketing images. User files are kept separately and are not shown here." action={<PlatformMediaUploader />}>
      <FilterBar action="/admin/media" search={q} placeholder="Search by file name" />
      {assets.length === 0 ? (
        <Card className="p-10 text-center text-sm text-secondary-text">{q ? "No files match your search." : "No platform files yet."}</Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => <PlatformMediaCard key={asset.id} asset={asset} />)}
        </div>
      )}
    </AdminPage>
  );
}
