"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Result = { error?: string; message?: string };

export function ConfirmAction({
  trigger,
  triggerClassName,
  title,
  description,
  confirmLabel,
  action,
}: {
  trigger: ReactNode;
  triggerClassName?: string;
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<Result>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const confirm = () => {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.error) setError(result.error);
        else dialogRef.current?.close();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => dialogRef.current?.showModal()}>
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-surface p-6 shadow-card backdrop:bg-navy/50"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-secondary-text">{description}</p>
        {error && (
          <p role="alert" className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={pending} onClick={() => dialogRef.current?.close()}>
            Cancel
          </Button>
          <Button type="button" variant="danger" disabled={pending} onClick={confirm}>
            {pending ? "Working..." : confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
