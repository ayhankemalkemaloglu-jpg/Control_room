import type { NewsItem } from "@/types/hermes";

/** Epoch ms of a news item's publish time, or 0 when unknown (sorts last). */
export function newsTimeMs(n: NewsItem): number {
  if (!n.published_at) return 0;
  const t = Date.parse(n.published_at);
  return Number.isNaN(t) ? 0 : t;
}

/** A new array sorted newest-first; undated items fall to the end (stable). */
export function sortNewsNewestFirst(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => newsTimeMs(b) - newsTimeMs(a));
}
