import { randomUUID } from "node:crypto";

import type {
  HourlyBriefing,
  MarketKind,
  OverallRead,
  Sentiment,
  SentimentBlock,
  SymbolSnapshot,
} from "../types";

interface SeedSymbol {
  symbol: string;
  name: string;
  market: MarketKind;
  /** Reference price used as the centre of the random walk. */
  base: number;
}

const UNIVERSE: SeedSymbol[] = [
  { symbol: "BTC", name: "Bitcoin", market: "crypto", base: 71250 },
  { symbol: "ETH", name: "Ethereum", market: "crypto", base: 3820 },
  { symbol: "SOL", name: "Solana", market: "crypto", base: 184 },
  { symbol: "AVAX", name: "Avalanche", market: "crypto", base: 41 },
  { symbol: "NVDA", name: "NVIDIA", market: "stock", base: 134 },
  { symbol: "AAPL", name: "Apple", market: "stock", base: 229 },
  { symbol: "THYAO", name: "Türk Hava Yolları", market: "stock", base: 312 },
  { symbol: "ASELS", name: "Aselsan", market: "stock", base: 68 },
];

function randIn(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sentimentFromScore(score: number): Sentiment {
  if (score > 15) return "bullish";
  if (score < -15) return "bearish";
  return "neutral";
}

function snapshotFor(seed: SeedSymbol): SymbolSnapshot {
  const changePct = round(randIn(-6, 6), 2);
  // Score loosely tracks the move but adds noise so it is not perfectly linear.
  const score = Math.max(-100, Math.min(100, Math.round(changePct * 12 + randIn(-18, 18))));
  const priceDecimals = seed.base >= 100 ? 2 : seed.base >= 10 ? 2 : 3;
  return {
    symbol: seed.symbol,
    name: seed.name,
    market: seed.market,
    price: round(seed.base * (1 + changePct / 100), priceDecimals),
    changePct,
    sentiment: sentimentFromScore(score),
    score,
  };
}

function aggregate(snapshots: SymbolSnapshot[]): SentimentBlock {
  if (snapshots.length === 0) {
    return { sentiment: "neutral", score: 0, changePct: 0 };
  }
  const score = Math.round(
    snapshots.reduce((sum, s) => sum + s.score, 0) / snapshots.length,
  );
  const changePct = round(
    snapshots.reduce((sum, s) => sum + s.changePct, 0) / snapshots.length,
    2,
  );
  return { sentiment: sentimentFromScore(score), score, changePct };
}

const HEADLINES: Record<Sentiment, string[]> = {
  bullish: [
    "Risk iştahı geri döndü, likidite üst bantlara akıyor.",
    "Alıcılar kontrolü ele aldı, momentum genişliyor.",
    "Geniş tabanlı alım; liderlik kriptoda toplanıyor.",
  ],
  bearish: [
    "Risk azaltımı hâkim, likidite alt banda çekildi.",
    "Satıcı baskısı sürüyor, momentum zayıflıyor.",
    "Defansif rotasyon; nakit pozisyonlar artıyor.",
  ],
  neutral: [
    "Piyasa kararsız, hacim düşük — yön arayışı sürüyor.",
    "Yatay seyir; katalizör beklentisi fiyatları sıkıştırıyor.",
    "Dengeli tablo, net liderlik yok.",
  ],
};

function pick<T>(items: readonly T[]): T {
  // Universe arrays are never empty, so the index is always valid.
  return items[Math.floor(Math.random() * items.length)] as T;
}

/** Build a fresh, lightly-randomised hourly briefing. */
export function createMockBriefing(now: Date = new Date()): HourlyBriefing {
  const symbols = UNIVERSE.map(snapshotFor);
  const crypto = symbols.filter((s) => s.market === "crypto");
  const stocks = symbols.filter((s) => s.market === "stock");

  const cryptoAggr = aggregate(crypto);
  const stockAggr = aggregate(stocks);

  const overallScore = Math.round((cryptoAggr.score + stockAggr.score) / 2);
  const overallSentiment = sentimentFromScore(overallScore);
  const overall: OverallRead = {
    sentiment: overallSentiment,
    score: overallScore,
    changePct: round((cryptoAggr.changePct + stockAggr.changePct) / 2, 2),
    headline: pick(HEADLINES[overallSentiment]),
  };

  const leaderSnapshot = symbols.reduce((best, s) =>
    s.changePct > best.changePct ? s : best,
  );

  return {
    id: randomUUID(),
    timestamp: now.toISOString(),
    overall,
    leader: {
      symbol: leaderSnapshot.symbol,
      name: leaderSnapshot.name,
      market: leaderSnapshot.market,
      changePct: leaderSnapshot.changePct,
    },
    cryptoAggr,
    stockAggr,
    symbols,
  };
}
