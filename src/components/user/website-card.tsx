"use client";

import { Copy, Eye, Pencil, Rocket, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { ScaledFrame } from "@/components/shared/scaled-frame";
import { Card } from "@/components/ui/card";
import { deleteWebsite, duplicateWebsite } from "@/features/websites/actions";
import type { MyWebsite } from "@/features/websites/queries";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-background text-secondary-text",
  published: "bg-success/10 text-green-800",
  unpublished: "bg-warning/15 text-amber-800",
  suspended: "bg-danger/10 text-red-700",
};

const ACTION = "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium";
const ENABLED = `${ACTION} text-foreground transition-colors hover:bg-background`;
const DISABLED = `${ACTION} cursor-not-allowed text-muted-text`;

export function WebsiteCard({ website }: { website: MyWebsite }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const duplicate = () => {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await duplicateWebsite(website.id);
        if (result.error) setError(result.error);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <ScaledFrame
        src={`/preview/sites/${website.id}`}
        title={`${website.name} preview`}
        deviceWidth={1280}
        className="aspect-[16/10] w-full border-b border-border"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-lg font-semibold break-words">{website.name}</h2>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              STATUS_STYLES[website.status],
            )}
          >
            {website.status}
          </span>
        </div>
        <dl className="mt-2 flex-1 space-y-0.5 text-sm text-secondary-text">
          <div>
            <dt className="inline">Address: </dt>
            <dd className="inline break-all">{website.slug}</dd>
          </div>
          {website.theme_name && (
            <div>
              <dt className="inline">Theme: </dt>
              <dd className="inline">
                {website.theme_name}
                {website.category_name && `, ${website.category_name}`}
              </dd>
            </div>
          )}
          <div>
            <dt className="inline">Last edited: </dt>
            <dd className="inline">
              {new Date(website.updated_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-1 border-t border-border pt-3">
          <Link href={`/editor/${website.id}`} className={ENABLED}>
            <Pencil className="size-4" aria-hidden />
            Edit
          </Link>
          <a href={`/preview/sites/${website.id}`} target="_blank" rel="noopener" className={ENABLED}>
            <Eye className="size-4" aria-hidden />
            Preview
          </a>
          <span aria-disabled="true" title="Publishing is coming soon" className={DISABLED}>
            <Rocket className="size-4" aria-hidden />
            Publish
          </span>
          <Link href={`/dashboard/websites/${website.id}/settings`} className={ENABLED}>
            <Settings className="size-4" aria-hidden />
            Settings
          </Link>
          <button type="button" onClick={duplicate} disabled={pending} className={cn(ENABLED, "disabled:opacity-60")}>
            <Copy className="size-4" aria-hidden />
            {pending ? "Copying..." : "Duplicate"}
          </button>
          <ConfirmAction
            triggerClassName={`${ACTION} text-danger transition-colors hover:bg-danger/10`}
            trigger={
              <>
                <Trash2 className="size-4" aria-hidden />
                Delete
              </>
            }
            title={`Delete ${website.name}?`}
            description="This permanently deletes the website, its pages and its content. This cannot be undone."
            confirmLabel="Delete website"
            action={() => deleteWebsite(website.id)}
          />
        </div>
      </div>
    </Card>
  );
}
