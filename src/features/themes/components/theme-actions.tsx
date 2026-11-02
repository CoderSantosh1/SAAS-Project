"use client";

import { useState, useTransition } from "react";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { activateVersion, deleteTheme, duplicateTheme, setThemeStatus, type ThemeActionResult } from "../actions";
import type { AdminTheme, AdminThemeVersion } from "../queries";

const PRIMARY = buttonVariants({ size: "md" });
const SECONDARY = buttonVariants({ variant: "secondary", size: "md" });
const DANGER = cn(buttonVariants({ variant: "secondary", size: "md" }), "text-danger");

export function ThemeActions({ theme }: { theme: AdminTheme }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const run = (action: () => Promise<ThemeActionResult>) => {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.error) setError(result.error);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const { status } = theme;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status !== "published" && (
          <ConfirmAction
            triggerClassName={PRIMARY}
            trigger="Publish"
            title={`Publish ${theme.name}?`}
            description="It will appear in the public marketplace, and anyone will be able to build a website with it."
            confirmLabel="Publish theme"
            confirmVariant="primary"
            action={() => setThemeStatus(theme.id, "published")}
          />
        )}
        {status === "published" && (
          <ConfirmAction
            triggerClassName={SECONDARY}
            trigger="Unpublish"
            title={`Unpublish ${theme.name}?`}
            description="It leaves the marketplace. Websites already built on it keep working."
            confirmLabel="Unpublish theme"
            action={() => setThemeStatus(theme.id, "unpublished")}
          />
        )}
        {status === "draft" && (
          <button type="button" disabled={pending} className={SECONDARY} onClick={() => run(() => setThemeStatus(theme.id, "under_review"))}>
            Send to review
          </button>
        )}
        {(status === "unpublished" || status === "under_review") && (
          <button type="button" disabled={pending} className={SECONDARY} onClick={() => run(() => setThemeStatus(theme.id, "draft"))}>
            Move to draft
          </button>
        )}
        <button type="button" disabled={pending} className={SECONDARY} onClick={() => run(() => duplicateTheme(theme.id))}>
          Duplicate details
        </button>
        {status !== "archived" && (
          <ConfirmAction
            triggerClassName={SECONDARY}
            trigger="Archive"
            title={`Archive ${theme.name}?`}
            description="It leaves the marketplace and your active list. Websites already built on it keep working."
            confirmLabel="Archive theme"
            action={() => setThemeStatus(theme.id, "archived")}
          />
        )}
        {status !== "published" && theme.website_count === 0 && (
          <ConfirmAction
            triggerClassName={DANGER}
            trigger="Delete"
            title={`Delete ${theme.name}?`}
            description="This permanently deletes the theme and all of its versions. This cannot be undone."
            confirmLabel="Delete theme"
            action={() => deleteTheme(theme.id)}
          />
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

export function ActivateVersionButton({ themeId, version }: { themeId: string; version: AdminThemeVersion }) {
  return (
    <ConfirmAction
      triggerClassName="rounded-md px-2 py-1 text-sm font-semibold text-primary-hover hover:bg-primary-light"
      trigger="Activate"
      title={`Activate version ${version.version}?`}
      description="New websites will use this version. Existing websites stay on the version they were built on."
      confirmLabel="Activate version"
      confirmVariant="primary"
      action={() => activateVersion(themeId, version.id)}
    />
  );
}
