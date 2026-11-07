// Pure helpers for the analytics page, kept apart from server code for tests.

export type Trend = { label: string; direction: "up" | "down" | "flat" | "new" };

// Compares this period with the one before it, in plain words.
export function trendLabel(total: number, previous: number): Trend {
  if (previous === 0) return total === 0 ? { label: "No visits yet", direction: "flat" } : { label: "New visitors this period", direction: "new" };
  const change = Math.round(((total - previous) / previous) * 100);
  if (change === 0) return { label: "Same as the previous period", direction: "flat" };
  return change > 0
    ? { label: `${change}% more than the previous period`, direction: "up" }
    : { label: `${Math.abs(change)}% fewer than the previous period`, direction: "down" };
}

export const PERIODS = [7, 30, 90] as const;

export function pageLabel(slug: string) {
  return slug === "" ? "Home" : slug.replaceAll("-", " ").replace(/^./, (char) => char.toUpperCase());
}
