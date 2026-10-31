"use client";

import { Button } from "@/components/ui/button";

// Keeps the sidebar visible when a dashboard page cannot load.
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">We could not load this page</h1>
      <p className="max-w-md text-sm text-secondary-text">Please try again in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
