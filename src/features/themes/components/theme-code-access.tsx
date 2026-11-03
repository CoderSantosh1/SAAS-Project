"use client";

import { Download, KeyRound, Trash2 } from "lucide-react";
import { AdminForm, Field } from "@/components/admin/admin-form";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { buttonVariants } from "@/components/ui/button";
import { grantThemeCode, revokeThemeCode } from "@/features/admin/panel-actions";
import { cn } from "@/lib/utils";
import type { ThemeCodeGrant } from "../queries";

const DURATIONS = [
  { value: "never", label: "No end date" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "365", label: "1 year" },
];

const date = (value: string) => new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });

export function ThemeCodeAccess({ themeId, grants, available }: { themeId: string; grants: ThemeCodeGrant[]; available: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-secondary-text">
          The package holds this theme&apos;s source, its images, the active version&apos;s content and a small Next.js app that runs it. Every download is
          recorded in the activity log.
        </p>
        {available ? (
          <a href={`/api/themes/${themeId}/code`} className={cn(buttonVariants(), "shrink-0")} download>
            <Download className="size-4" aria-hidden />
            Download code
          </a>
        ) : (
          <span className="text-sm text-secondary-text">This theme&apos;s component has no source in this deployment.</span>
        )}
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <KeyRound className="size-4 text-primary" aria-hidden />
          Give a customer access
        </h3>
        <p className="mt-1 text-xs text-secondary-text">They will see a download button under Theme Code in their dashboard. They must already have an account.</p>
        <AdminForm action={grantThemeCode.bind(null, themeId)} submitLabel="Give access" resetOnSuccess className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr] sm:items-end">
          <Field label="Customer email" name="email" type="email" required placeholder="customer@example.com" className="h-10" />
          <label className="block space-y-1.5">
            <span className="block text-sm font-medium">Access for</span>
            <select name="days" defaultValue="never" className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm">
              {DURATIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <Field label="Note (optional)" name="note" maxLength={300} placeholder="For example: agency partner, order #1042" className="h-10" />
          </div>
        </AdminForm>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border text-xs font-semibold text-secondary-text">
            <tr>
              <th scope="col" className="px-4 py-3">Customer</th>
              <th scope="col" className="px-4 py-3">Given</th>
              <th scope="col" className="px-4 py-3">Ends</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {grants.map((grant) => {
              const expired = grant.expires_at !== null && new Date(grant.expires_at) <= new Date();
              return (
                <tr key={grant.id}>
                  <td className="px-4 py-3">
                    <span className="block font-medium">{grant.full_name ?? grant.email}</span>
                    {grant.full_name && <span className="block text-xs text-secondary-text">{grant.email}</span>}
                    {grant.note && <span className="block text-xs text-secondary-text">{grant.note}</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-secondary-text">
                    {date(grant.created_at)}
                    {grant.granted_by_email && <span className="block text-xs">by {grant.granted_by_email}</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {grant.expires_at ? <span className={expired ? "text-danger" : "text-secondary-text"}>{expired ? "Ended " : ""}{date(grant.expires_at)}</span> : <span className="text-secondary-text">No end date</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ConfirmAction
                      triggerClassName="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-danger hover:bg-danger/10"
                      trigger={
                        <>
                          <Trash2 className="size-4" aria-hidden />
                          Remove
                        </>
                      }
                      title={`Remove ${grant.email}'s access?`}
                      description="They will no longer be able to download this theme's code. Packages they already downloaded stay with them."
                      confirmLabel="Remove access"
                      action={() => revokeThemeCode(themeId, grant.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {grants.length === 0 && <p className="px-4 py-6 text-center text-sm text-secondary-text">No customer has access yet.</p>}
      </div>
    </div>
  );
}
