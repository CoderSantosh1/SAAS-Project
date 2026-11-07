"use client";

import { useState } from "react";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requestPlan } from "../actions";

export function RequestPlanButton({ slug, name, price, primary }: { slug: string; name: string; price: string; primary?: boolean }) {
  const [message, setMessage] = useState<string>();

  if (message) {
    return (
      <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-green-800">
        {message}
      </p>
    );
  }

  return (
    <ConfirmAction
      triggerClassName={cn(buttonVariants({ variant: primary ? "primary" : "secondary" }), "w-full")}
      trigger={`Choose ${name}`}
      title={`Switch to ${name}?`}
      description={`${name} costs ${price === "Free" ? "nothing" : `${price} a month`}. We will send your request to our team, who will contact you about payment and switch your plan.`}
      confirmLabel="Send request"
      confirmVariant="primary"
      action={async () => {
        const result = await requestPlan(slug);
        if (!result.error) setMessage(result.message);
        return result;
      }}
    />
  );
}
