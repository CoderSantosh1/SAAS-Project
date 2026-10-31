import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground transition-colors placeholder:text-muted-text focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-primary-light aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}
