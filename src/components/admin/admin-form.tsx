"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { FormStatus } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadAdminImage } from "@/features/admin/upload";
import type { FormResult } from "@/features/admin/panel-actions";

type Action = (state: FormResult, form: FormData) => Promise<FormResult>;

// Submits through onSubmit rather than the form's action prop, because React clears a
// form after an action prop runs, which would erase what was typed when a save fails.
export function AdminForm({
  action,
  submitLabel,
  submitVariant,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: Action;
  submitLabel: string;
  submitVariant?: "primary" | "secondary" | "danger";
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [result, formAction, pending] = useActionState(async (state: FormResult, form: FormData) => {
    const next = await action(state, form);
    return next;
  }, {});
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && result.message) formRef.current?.reset();
  }, [resetOnSuccess, result]);

  return (
    <form
      ref={formRef}
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className={className ?? "space-y-4"}
    >
      <FormStatus result={result} />
      {children}
      <Button type="submit" variant={submitVariant} disabled={pending}>
        {pending ? "Working..." : submitLabel}
      </Button>
    </form>
  );
}

const CONTROL = "w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground";

export function Field({ label, hint, ...props }: ComponentProps<typeof Input> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <Input {...props} />
      {hint && <span className="block text-xs text-secondary-text">{hint}</span>}
    </label>
  );
}

export function TextareaField({ label, hint, ...props }: ComponentProps<"textarea"> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <textarea rows={3} {...props} className={`${CONTROL} py-2`} />
      {hint && <span className="block text-xs text-secondary-text">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  options,
  ...props
}: ComponentProps<"select"> & { label: string; options: { value: string; label: string }[] }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <select {...props} className={`${CONTROL} h-10`}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckField({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" {...props} className="size-4 accent-primary" />
      {label}
    </label>
  );
}

// Uploads to the given folder, and submits the resulting address with the form.
export function ImageUploadField({
  label,
  name,
  folder,
  defaultValue,
}: {
  label: string;
  name: string;
  folder: "categories" | "settings";
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<string>();

  const onFile = async (file?: File) => {
    if (!file) return;
    setStatus("Uploading...");
    try {
      const result = await uploadAdminImage(file, folder);
      if (result.url) setUrl(result.url);
      setStatus(result.error ?? "Uploaded. Save to keep this change.");
    } catch {
      setStatus("We could not upload that image.");
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block space-y-1.5">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/x-icon"
          onChange={(event) => void onFile(event.target.files?.[0])}
          className="block w-full text-sm text-secondary-text file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:text-sm file:font-semibold file:text-foreground"
        />
      </label>
      <input type="hidden" name={name} value={url} />
      {url && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-12 w-20 rounded-md border border-border bg-background object-contain" />
          <button type="button" className="text-xs font-semibold text-danger" onClick={() => setUrl("")}>
            Remove
          </button>
        </div>
      )}
      {status && (
        <p role="status" className="text-xs text-secondary-text">
          {status}
        </p>
      )}
    </div>
  );
}
