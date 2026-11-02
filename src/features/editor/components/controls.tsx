"use client";

import { Image as ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MediaAsset } from "@/features/media/queries";
import { uploadImage } from "@/features/media/upload";
import { ALLOWED_IMAGE_TYPES } from "@/features/media/schemas";
import { listMediaForPicker } from "../actions";

export const LABEL = "block text-xs font-medium text-secondary-text";
export const ICON_BUTTON =
  "rounded-md p-1.5 text-secondary-text transition-colors hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export function Labeled({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className={LABEL}>{label}</span>
      {children}
      {error && <span className="block text-xs text-danger">{error}</span>}
    </label>
  );
}

export function TextArea(props: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={3}
      {...props}
      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-primary-light"
    />
  );
}

// For values that must not be saved half-typed, such as page addresses. The change
// is applied when the field loses focus, and a rejected value reverts.
export function CommitInput({
  value,
  onCommit,
  ...props
}: Omit<ComponentProps<typeof Input>, "value" | "onChange" | "onBlur"> & {
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      {...props}
      value={draft ?? value}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft !== null) onCommit(draft);
        setDraft(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}

export function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="space-y-1">
      <span className={LABEL}>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={(value ?? fallback).toLowerCase()}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-14 cursor-pointer rounded-md border border-border bg-surface p-1"
        />
        <span className="flex-1 text-xs text-secondary-text">{value ?? "Theme default"}</span>
        {value && (
          <Button type="button" variant="ghost" className="h-8 px-2 text-xs" onClick={() => onChange(undefined)}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

export function MediaGrid({ onSelect }: { onSelect?: (asset: MediaAsset) => void }) {
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const refresh = () =>
    listMediaForPicker()
      .then(setAssets)
      .catch(() => setError("We could not load your images."));

  useEffect(() => {
    let active = true;
    listMediaForPicker()
      .then((result) => {
        if (active) setAssets(result);
      })
      .catch(() => {
        if (active) setError("We could not load your images.");
      });
    return () => {
      active = false;
    };
  }, []);

  const upload = (files: FileList | null) => {
    const selected = [...(files ?? [])];
    if (selected.length === 0) return;
    setError(undefined);
    startTransition(async () => {
      for (const file of selected) {
        const result = await uploadImage(file);
        if (result.error) {
          setError(`${file.name}: ${result.error}`);
          break;
        }
      }
      await refresh();
    });
  };

  return (
    <div className="space-y-3">
      <label className="flex h-9 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-sm font-medium text-primary-hover hover:bg-primary-light has-disabled:opacity-60">
        {pending ? "Uploading..." : "Upload images"}
        <input
          type="file"
          multiple
          disabled={pending}
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={(event) => {
            upload(event.target.files);
            event.target.value = "";
          }}
          className="sr-only"
        />
      </label>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {assets === null && !error && <p className="text-xs text-secondary-text">Loading images...</p>}
      {assets?.length === 0 && <p className="text-xs text-secondary-text">Your library is empty.</p>}
      {assets && assets.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {assets.map((asset) => (
            <li key={asset.id}>
              {/* eslint-disable @next/next/no-img-element */}
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(asset)}
                  aria-label={`Use ${asset.file_name}`}
                  className="block w-full overflow-hidden rounded-md border border-border hover:border-primary"
                >
                  <img src={asset.url} alt="" loading="lazy" className="aspect-square w-full bg-background object-contain" />
                </button>
              ) : (
                <img
                  src={asset.url}
                  alt={asset.file_name}
                  title={asset.file_name}
                  loading="lazy"
                  className="aspect-square w-full rounded-md border border-border bg-background object-contain"
                />
              )}
              {/* eslint-enable @next/next/no-img-element */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ImagePicker({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => {
    dialogRef.current?.close();
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      <span className={LABEL}>{label}</span>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-20 w-full rounded-md border border-border bg-background object-contain" />
      )}
      <div className="flex gap-1.5">
        <Button
          type="button"
          variant="secondary"
          className="h-9 flex-1 px-2 text-xs"
          onClick={() => {
            setOpen(true);
            dialogRef.current?.showModal();
          }}
        >
          <ImageIcon className="size-4" aria-hidden />
          {value ? "Change" : "Choose image"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" className="h-9 px-2 text-xs" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
      </div>
      {error && <span className="block text-xs text-danger">{error}</span>}
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto max-h-[80dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-card backdrop:bg-navy/50"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Choose an image</h2>
          <button type="button" aria-label="Close" onClick={close} className={ICON_BUTTON}>
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {open && (
          <MediaGrid
            onSelect={(asset) => {
              onChange(asset.url);
              close();
            }}
          />
        )}
      </dialog>
    </div>
  );
}
