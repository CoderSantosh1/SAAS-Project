"use client";

import { Copy, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deletePlatformMedia, recordPlatformMedia } from "../panel-actions";
import type { AdminMedia } from "../panel-queries";
import { uploadAdminImage } from "../upload";

function imageSize(file: File) {
  return createImageBitmap(file)
    .then((bitmap) => {
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return size;
    })
    .catch(() => ({ width: null, height: null }));
}

export function PlatformMediaUploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const upload = (files: FileList | null) => {
    const selected = [...(files ?? [])];
    if (selected.length === 0) return;
    setError(undefined);
    startTransition(async () => {
      try {
        for (const file of selected) {
          const stored = await uploadAdminImage(file, "library");
          if (!stored.path) {
            setError(`${file.name}: ${stored.error}`);
            break;
          }
          const result = await recordPlatformMedia({
            path: stored.path,
            file_name: file.name,
            mime_type: stored.contentType,
            size_bytes: file.size,
            ...(await imageSize(file)),
          });
          if (result.error) {
            setError(`${file.name}: ${result.error}`);
            break;
          }
        }
      } catch {
        setError("We could not upload that file. Please try again.");
      }
      if (input.current) input.current.value = "";
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <label className={`${buttonVariants()} cursor-pointer has-disabled:opacity-60`}>
        <Upload className="size-4" aria-hidden />
        {pending ? "Uploading..." : "Upload files"}
        <input ref={input} type="file" multiple disabled={pending} accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/x-icon" onChange={(event) => upload(event.target.files)} className="sr-only" />
      </label>
      {error && <p role="alert" className="max-w-sm text-right text-sm text-danger">{error}</p>}
    </div>
  );
}

export function PlatformMediaCard({ asset }: { asset: AdminMedia & { url: string } }) {
  const [copied, setCopied] = useState(false);
  const size = asset.size_bytes < 1024 * 1024 ? `${Math.ceil(asset.size_bytes / 1024)} KB` : `${(asset.size_bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <Card className="overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.url} alt={asset.file_name} loading="lazy" className="aspect-square w-full bg-background object-contain" />
      <div className="border-t border-border p-3">
        <p className="truncate text-sm font-medium" title={asset.file_name}>{asset.file_name}</p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <p className="min-w-0 truncate text-xs text-secondary-text">{size}{asset.width && asset.height ? `, ${asset.width} x ${asset.height}` : ""}</p>
          <div className="flex shrink-0">
            <button
              type="button"
              aria-label={copied ? "Address copied" : `Copy address of ${asset.file_name}`}
              title={copied ? "Copied" : "Copy address"}
              className="rounded-md p-1.5 text-secondary-text hover:bg-background"
              onClick={() => {
                void navigator.clipboard.writeText(asset.url).then(() => setCopied(true));
              }}
            >
              <Copy className="size-4" aria-hidden />
            </button>
            <ConfirmAction
              triggerClassName="rounded-md p-1.5 text-danger hover:bg-danger/10"
              trigger={<Trash2 className="size-4" aria-label={`Delete ${asset.file_name}`} />}
              title="Delete this file?"
              description="Anything using this file will show it as broken. This cannot be undone."
              confirmLabel="Delete file"
              action={() => deletePlatformMedia(asset.id)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
