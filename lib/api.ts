import type {
  Briefing,
  Candle,
  ChartTimeframe,
  Health,
  NewsItem,
  Stats,
  StatsWindow,
  Trade,
  TurkeyMarkets,
} from "@/types/hermes";

/**
 * REST hydration client for the Hermes backend. The socket stream
 * (see `hooks/useHermesSocket`) keeps state live; these one-shot fetches
 * backfill history on mount so the panels aren't empty before the first
 * realtime event arrives.
 */

const API_URL =
  process.env.NEXT_PUBLIC_HERMES_API_URL ??
  process.env.NEXT_PUBLIC_HERMES_WS_URL ??
  "http://localhost:4000";

const AUTH_TOKEN = process.env.NEXT_PUBLIC_HERMES_TOKEN ?? "";

async function hermesFetch(path: string): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`Hermes API ${path} → ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Tolerate both a bare array and the common wrappers
 * (`{ trades: [] }`, `{ data: [] }`, …) so we don't break if the backend
 * envelope shape differs from a plain list.
 */
function asArray<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[];
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    for (const key of ["trades", "briefings", "data", "items", "results"]) {
      if (Array.isArray(obj[key])) return obj[key] as T[];
    }
  }
  return [];
}

/** Unwrap stats from a bare object or a `{ stats }` / `{ data }` envelope. */
function asStats(json: unknown): Stats | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;
  const candidate = obj.stats ?? obj.data ?? obj;
  return candidate && typeof candidate === "object"
    ? (candidate as Stats)
    : null;
}

export async function fetchOpenPositions(): Promise<Trade[]> {
  return asArray<Trade>(await hermesFetch("/trades?status=OPEN"));
}

export async function fetchClosedTrades(): Promise<Trade[]> {
  return asArray<Trade>(await hermesFetch("/trades?status=CLOSED&limit=50"));
}

export async function fetchStats(window: StatsWindow = "24h"): Promise<Stats | null> {
  return asStats(await hermesFetch(`/trades/stats?window=${window}`));
}

export async function fetchNews(category = "crypto", count = 15): Promise<NewsItem[]> {
  return asArray<NewsItem>(
    await hermesFetch(`/news?category=${encodeURIComponent(category)}&count=${count}`),
  );
}

/**
 * Ask the voice assistant (POST /assistant). The backend returns a short reply
 * even on a handled failure, so we surface `reply` directly; only a transport
 * failure throws (the caller speaks a fallback).
 */
export async function askAssistant(message: string): Promise<string> {
  const res = await fetch(`${API_URL}/assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({ message }),
  });
  const data = (await res.json()) as { reply?: string };
  return data.reply ?? "Cevap alınamadı.";
}

export async function fetchTurkeyMarkets(): Promise<TurkeyMarkets | null> {
  try {
    const json = await hermesFetch("/markets/turkey");
    return json && typeof json === "object" ? (json as TurkeyMarkets) : null;
  } catch {
    return null;
  }
}

export async function fetchBriefings(): Promise<Briefing[]> {
  return asArray<Briefing>(await hermesFetch("/briefings?limit=6"));
}

/** OHLCV candles for charting. Throws on failure so the chart can show an error state. */
export async function fetchKlines(
  symbol: string,
  timeframe: ChartTimeframe,
  limit = 200,
): Promise<Candle[]> {
  const json = await hermesFetch(
    `/charts/${encodeURIComponent(symbol)}?timeframe=${timeframe}&limit=${limit}`,
  );
  if (json && typeof json === "object" && Array.isArray((json as { candles?: unknown }).candles)) {
    return (json as { candles: Candle[] }).candles;
  }
  return [];
}

/**
 * Liveness probe for the bottom-bar status LEDs. Unlike the other fetches this
 * never throws — a failure means "backend unreachable", which the caller
 * renders as a down LED, so we resolve to null instead of propagating.
 */
export async function fetchHealth(): Promise<Health | null> {
  try {
    const json = await hermesFetch("/health");
    return json && typeof json === "object" ? (json as Health) : null;
  } catch {
    return null;
  }
}
