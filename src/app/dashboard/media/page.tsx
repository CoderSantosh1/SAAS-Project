import { Image as ImageIcon, Search, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTitle } from "@/components/user/page-title";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MediaCard } from "@/features/media/components/media-card";
import { MediaUploader } from "@/features/media/components/media-uploader";
import { listMyMedia } from "@/features/media/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Media Library" };

const searchSchema = z.string().trim().max(80).optional().catch(undefined);

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireUser();
  const q = searchSchema.parse((await searchParams).q);
  const assets = await listMyMedia(profile.id, q);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageTitle title="Media Library" description="Images and logos for your websites, up to 10 MB each." action={<MediaUploader />} />

      <form action="/dashboard/media" role="search" className="flex gap-2 rounded-lg border border-border bg-surface p-2 shadow-card">
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3 size-4 text-muted-text" aria-hidden />
          <Input name="q" type="search" defaultValue={q} placeholder="Search by file name" aria-label="Search media" className="border-transparent bg-background pl-9 focus-visible:bg-surface" maxLength={80} />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {assets.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <MediaCard key={asset.id} asset={asset} />
          ))}
        </div>
      ) : (
        <Card>
          {q ? (
            <EmptyState
              icon={SearchX}
              title="No images match your search"
              action={
                <Link href="/dashboard/media" className="text-sm font-semibold text-primary hover:text-primary-hover">
                  Clear search
                </Link>
              }
            />
          ) : (
            <EmptyState icon={ImageIcon} title="Your library is empty" text="Upload photos and logos here, then use them on any of your websites." action={<MediaUploader />} />
          )}
        </Card>
      )}
    </div>
  );
}
