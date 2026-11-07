"use client";

import { Check, Copy, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDomain, removeDomain } from "../actions";

export function AddDomainForm({ websites }: { websites: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; message?: string }>();
  const [hostname, setHostname] = useState("");
  const [websiteId, setWebsiteId] = useState(websites[0]?.id ?? "");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        const next = await addDomain(websiteId, hostname);
        setResult(next);
        if (!next.error) setHostname("");
      } catch {
        setResult({ error: "Something went wrong. Please try again." });
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
        <label className="space-y-1.5 text-sm font-medium">
          <span>Website</span>
          <select
            value={websiteId}
            onChange={(event) => setWebsiteId(event.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground"
          >
            {websites.map((website) => (
              <option key={website.id} value={website.id}>
                {website.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>Your domain</span>
          <Input value={hostname} onChange={(event) => setHostname(event.target.value)} placeholder="www.yourbusiness.in" required maxLength={260} autoComplete="off" spellCheck={false} />
        </label>
        <Button type="submit" disabled={pending || !websiteId} className="self-end">
          {pending ? "Adding..." : "Add domain"}
        </Button>
      </div>
      {result?.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {result.error}
        </p>
      )}
      {result?.message && (
        <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-green-800">
          {result.message}
        </p>
      )}
    </form>
  );
}

export function CopyValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary-hover hover:bg-primary-light"
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function RemoveDomainButton({ id, hostname }: { id: string; hostname: string }) {
  return (
    <ConfirmAction
      triggerClassName="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
      trigger={
        <>
          <Trash2 className="size-4" aria-hidden />
          Remove
        </>
      }
      title={`Remove ${hostname}?`}
      description="Visitors will no longer reach your website at this domain. Your website stays live at its free address."
      confirmLabel="Remove domain"
      action={() => removeDomain(id)}
    />
  );
}
