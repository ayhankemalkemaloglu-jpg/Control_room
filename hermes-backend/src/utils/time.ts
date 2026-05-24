/** Current time as an ISO-8601 string. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Normalize an optional ISO string to a valid ISO timestamp, defaulting to now. */
export function toIso(value: string | undefined): string {
  if (!value) return nowIso();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? nowIso() : date.toISOString();
}

/** Whole minutes a position was held between two ISO timestamps. */
export function holdMinutes(openedAtIso: string, closedAtIso: string): number {
  const opened = new Date(openedAtIso).getTime();
  const closed = new Date(closedAtIso).getTime();
  if (Number.isNaN(opened) || Number.isNaN(closed)) return 0;
  return Math.max(0, Math.round((closed - opened) / 60_000));
}

export type StatsWindow = "24h" | "7d" | "30d" | "all";

/** ISO cutoff for a stats window, or null for "all". */
export function windowCutoffIso(window: string): string | null {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  switch (window) {
    case "24h":
      return new Date(now - day).toISOString();
    case "7d":
      return new Date(now - 7 * day).toISOString();
    case "30d":
      return new Date(now - 30 * day).toISOString();
    default:
      return null;
  }
}
