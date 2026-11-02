"use client";

import { useState, useTransition } from "react";
import { setDomainSuspended, verifyDomain, type FormResult } from "../panel-actions";

const LINK = "font-semibold text-primary-hover hover:underline disabled:opacity-60";

export function DomainActions({ id, hostname, token, status }: { id: string; hostname: string; token: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<FormResult>({});

  const run = (action: () => Promise<FormResult>) => {
    setResult({});
    startTransition(async () => {
      try {
        setResult(await action());
      } catch {
        setResult({ error: "Something went wrong. Please try again." });
      }
    });
  };

  return (
    <div className="space-y-1 text-right">
      <div className="flex justify-end gap-3 whitespace-nowrap">
        {status !== "suspended" && (
          <button type="button" disabled={pending} className={LINK} onClick={() => run(() => verifyDomain(id, hostname, token))}>
            {pending ? "Working..." : "Check DNS"}
          </button>
        )}
        <button type="button" disabled={pending} className="font-semibold text-danger hover:underline disabled:opacity-60" onClick={() => run(() => setDomainSuspended(id, status !== "suspended"))}>
          {status === "suspended" ? "Unsuspend" : "Suspend"}
        </button>
      </div>
      {result.error && <p role="alert" className="max-w-xs text-xs whitespace-normal text-danger">{result.error}</p>}
      {result.message && <p role="status" className="text-xs text-green-800">{result.message}</p>}
    </div>
  );
}
