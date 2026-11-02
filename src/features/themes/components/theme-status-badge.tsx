const STYLES: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-background text-secondary-text" },
  under_review: { label: "Under review", className: "bg-warning/15 text-amber-800" },
  published: { label: "Published", className: "bg-success/10 text-green-800" },
  unpublished: { label: "Unpublished", className: "bg-background text-secondary-text" },
  archived: { label: "Archived", className: "bg-danger/10 text-red-700" },
};

export function ThemeStatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? { label: status, className: "bg-background text-secondary-text" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${style.className}`}>
      {style.label}
    </span>
  );
}
