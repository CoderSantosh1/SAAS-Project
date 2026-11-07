import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// A friendly placeholder for lists with nothing in them yet.
export function EmptyState({ icon: Icon = Inbox, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="mt-4 font-heading font-semibold text-navy">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-secondary-text">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
