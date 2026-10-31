import { Image as ImageIcon, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
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

      <form action="/dashboard/media" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3 size-4 text-muted-text" aria-hidden />
          <Input name="q" type="search" defaultValue={q} placeholder="Search by file name" aria-label="Search media" className="pl-9" maxLength={80} />
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
        <Card className="flex flex-col items-center p-12 text-center">
          <ImageIcon className="size-10 text-accent" aria-hidden />
          {q ? (
            <>
              <h2 className="mt-4 text-lg font-semibold">No images match your search</h2>
              <Link href="/dashboard/media" className="mt-3 text-sm font-semibold text-primary hover:text-primary-hover">
                Clear search
              </Link>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-lg font-semibold">Your library is empty</h2>
              <p className="mt-1 text-sm text-secondary-text">Upload your first image to get started.</p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
