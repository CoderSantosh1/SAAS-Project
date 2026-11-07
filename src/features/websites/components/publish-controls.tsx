"use client";

import { CloudOff, ExternalLink, Rocket } from "lucide-react";
import { useState } from "react";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { cn } from "@/lib/utils";
import { publishWebsite, unpublishWebsite } from "../publish-actions";
import { liveSitePath } from "../urls";

const ACTION = "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors";

// Publish, update or take down a website, from the website card.
export function PublishControls({ website }: { website: { id: string; name: string; slug: string; status: string } }) {
  const [message, setMessage] = useState<string>();
  const live = website.status === "published";

  if (website.status === "suspended") {
    return (
      <span aria-disabled="true" title="This website is suspended. Contact support for help." className={cn(ACTION, "cursor-not-allowed text-muted-text")}>
        <Rocket className="size-4" aria-hidden />
        Suspended
      </span>
    );
  }

  const run = (action: typeof publishWebsite) => async () => {
    const result = await action(website.id);
    setMessage(result.error ? undefined : result.message);
    return result;
  };

  return (
    <>
      <ConfirmAction
        triggerClassName={cn(ACTION, "text-primary-hover hover:bg-primary-light")}
        trigger={
          <>
            <Rocket className="size-4" aria-hidden />
            {live ? "Update live site" : "Publish"}
          </>
        }
        title={live ? `Update ${website.name}?` : `Publish ${website.name}?`}
        description={
          live
            ? "Your latest saved changes replace what visitors see now."
            : `Anyone will be able to visit it at ${liveSitePath(website.slug)}. You can take it offline at any time.`
        }
        confirmLabel={live ? "Update live site" : "Publish website"}
        confirmVariant="primary"
        action={run(publishWebsite)}
      />
      {live && (
        <>
          <a href={liveSitePath(website.slug)} target="_blank" rel="noopener" className={cn(ACTION, "text-foreground hover:bg-background")}>
            <ExternalLink className="size-4" aria-hidden />
            View live
          </a>
          <ConfirmAction
            triggerClassName={cn(ACTION, "text-foreground hover:bg-background")}
            trigger={
              <>
                <CloudOff className="size-4" aria-hidden />
                Unpublish
              </>
            }
            title={`Take ${website.name} offline?`}
            description="Visitors will no longer see it. Your content stays safe, and you can publish again whenever you like."
            confirmLabel="Unpublish"
            action={run(unpublishWebsite)}
          />
        </>
      )}
      {message && (
        <p role="status" className="w-full text-sm font-medium text-success">
          {message}
        </p>
      )}
    </>
  );
}
