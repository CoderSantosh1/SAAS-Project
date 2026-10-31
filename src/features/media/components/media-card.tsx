"use client";

import { Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { Card } from "@/components/ui/card";
import { deleteMediaAsset } from "../actions";
import type { MediaAsset } from "../queries";

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaCard({ asset }: { asset: MediaAsset }) {
  return (
    <Card className="overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.url} alt={asset.file_name} loading="lazy" className="aspect-square w-full bg-background object-contain" />
      <div className="border-t border-border p-3">
        <p className="truncate text-sm font-medium" title={asset.file_name}>
          {asset.file_name}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xs text-secondary-text">
            {formatSize(asset.size_bytes)}
            {asset.width && asset.height && `, ${asset.width} x ${asset.height}`}
          </p>
          <ConfirmAction
            triggerClassName="rounded-md p-1.5 text-danger transition-colors hover:bg-danger/10"
            trigger={<Trash2 className="size-4" aria-label={`Delete ${asset.file_name}`} />}
            title="Delete this image?"
            description="Any website using this image will show it as broken. This cannot be undone."
            confirmLabel="Delete image"
            action={() => deleteMediaAsset(asset.id)}
          />
        </div>
      </div>
    </Card>
  );
}
