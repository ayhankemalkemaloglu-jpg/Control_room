import { config } from "../config";
import { logger } from "../utils/logger";

interface CacheEntry {
  price: number;
  fetchedAt: number;
}

const CACHE_TTL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 5_000;

const cache = new Map<string, CacheEntry>();

/**
 * Current spot price for a symbol (e.g. "BTCUSDT"). Cached for 30s.
 * Returns null on any error/timeout — callers mark the trade CLOSED_NO_EXIT.
 */
export async function getCurrentPrice(symbol: string): Promise<number | null> {
  const sym = symbol.toUpperCase();

  const cached = cache.get(sym);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.price;
  }

  const url = `${config.binanceApiBase}/api/v3/ticker/price?symbol=${encodeURIComponent(sym)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) {
      logger.warn({ symbol: sym, status: res.status }, "binance price non-200");
      return null;
    }
    const data = (await res.json()) as { price?: string };
    const price = data.price ? Number.parseFloat(data.price) : Number.NaN;
    if (!Number.isFinite(price)) {
      logger.warn({ symbol: sym }, "binance price unparseable");
      return null;
    }
    cache.set(sym, { price, fetchedAt: Date.now() });
    return price;
  } catch (err) {
    logger.warn(
      { symbol: sym, err: err instanceof Error ? err.message : String(err) },
      "binance price fetch failed",
    );
    return null;
  }
}
