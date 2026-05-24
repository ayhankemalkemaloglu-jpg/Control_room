import type { Sentiment, TradeSide } from "@/types/hermes";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatUsd(value: number, compact = false): string {
  return compact ? usdCompact.format(value) : usd.format(value);
}

export function formatPrice(value: number): string {
  const decimals = value >= 100 ? 2 : value >= 1 ? 2 : 4;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatSignedPct(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatSignedUsd(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${usd.format(Math.abs(value))}`;
}

/** Wall-clock HH:mm:ss in a fixed time zone — deterministic across SSR/CSR. */
export function formatClock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

/** HH:mm for a fixed ISO input in a fixed time zone — hydration-safe. */
export function formatHM(iso: string, timeZone = "Europe/Istanbul"): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(iso));
}

const SENTIMENT_LABEL: Record<Sentiment, string> = {
  bullish: "Yükseliş",
  bearish: "Düşüş",
  neutral: "Nötr",
};

export function sentimentLabel(sentiment: Sentiment): string {
  return SENTIMENT_LABEL[sentiment];
}

/** Tailwind text-color class for a sentiment. */
export function sentimentColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case "bullish":
      return "text-bullish";
    case "bearish":
      return "text-bearish";
    default:
      return "text-neutral";
  }
}

/** Tailwind text-color class for a signed value. */
export function deltaColor(value: number): string {
  if (value > 0) return "text-bullish";
  if (value < 0) return "text-bearish";
  return "text-neutral";
}

export function sideLabel(side: TradeSide): string {
  return side === "long" ? "LONG" : "SHORT";
}

/**
 * Strip the quote suffix from a pair and uppercase it: `"btcusdt"` → `"BTC"`.
 * Uppercase first so the (case-sensitive) replace matches lowercase input.
 */
export function shortSymbol(symbol: string): string {
  return symbol.toUpperCase().replace("USDT", "");
}
