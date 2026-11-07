// Pure billing helpers for the plans page, kept apart from server code for tests.

export function formatRupees(paise: number) {
  if (paise === 0) return "Free";
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: rupees % 1 ? 2 : 0 })}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// How full a limit is, from 0 to 100. A missing limit means unlimited, shown as null.
export function usagePercent(used: number, limit: number | null | undefined) {
  if (!limit || limit <= 0) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function limitLabel(limit: number | null | undefined, unit: string) {
  return limit ? `${limit.toLocaleString("en-IN")} ${unit}` : `Unlimited ${unit}`;
}
