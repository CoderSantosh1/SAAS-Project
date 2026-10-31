export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto max-w-5xl animate-pulse space-y-6">
      <div className="h-8 w-56 rounded-md bg-border" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-lg bg-border" />
        <div className="h-28 rounded-lg bg-border" />
        <div className="h-28 rounded-lg bg-border" />
      </div>
    </div>
  );
}
