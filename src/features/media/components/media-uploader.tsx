"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { uploadImage } from "../upload";
import { ALLOWED_IMAGE_TYPES } from "../schemas";

export function MediaUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const onChange = (files: FileList | null) => {
    if (!files?.length) return;
    const selected = [...files];
    setError(undefined);
    startTransition(async () => {
      for (const file of selected) {
        const result = await uploadImage(file);
        if (result.error) {
          setError(`${file.name}: ${result.error}`);
          break;
        }
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <label className={`${buttonVariants()} cursor-pointer has-disabled:pointer-events-none has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary`}>
        <Upload className="size-4" aria-hidden />
        {pending ? "Uploading..." : "Upload images"}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          disabled={pending}
          onChange={(event) => onChange(event.target.files)}
          className="sr-only"
        />
      </label>
      {error && (
        <p role="alert" className="max-w-sm text-right text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
