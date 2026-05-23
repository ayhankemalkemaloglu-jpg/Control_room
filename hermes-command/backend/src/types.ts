/**
 * Hermes Command Center — shared domain types.
 * Kept in sync with the frontend copy at `frontend/types/hermes.ts`.
 */

export type Sentiment = "bullish" | "bearish" | "neutral";

export type MarketKind = "crypto" | "stock";

export type TradeSide = "long" | "short";

export type TradeAction = "open" | "close" | "increase" | "reduce" | "tp" | "sl";

/** Aggregate read for a market segment (crypto / equities). */
export interface SentimentBlock {
  sentiment: Sentiment;
  /** Normalised conviction score, -100 (max bearish) .. 100 (max bullish). */
  score: number;
  /** Aggregate move over the briefing window, percent. */
  changePct: number;
}

/** Per-symbol snapshot included in an hourly briefing. */
export interface SymbolSnapshot {
  symbol: string;
  name: string;
  market: MarketKind;
  price: number;
  changePct: number;
  sentiment: Sentiment;
  score: number;
}

/** Best mover of the briefing window. */
export interface MarketLeader {
  symbol: string;
  name: string;
  market: MarketKind;
  changePct: number;
}

/** Top-line market read with a one-line headline. */
export interface OverallRead extends SentimentBlock {
  headline: string;
}

/**
 * The core artefact Hermes pushes on the hour: a structured read of the
 * market across crypto and equities plus per-symbol detail.
 */
export interface HourlyBriefing {
  id: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  overall: OverallRead;
  leader: MarketLeader;
  cryptoAggr: SentimentBlock;
  stockAggr: SentimentBlock;
  symbols: SymbolSnapshot[];
}

/** A discrete trade lifecycle event emitted by the Hermes bot. */
export interface TradeEvent {
  id: string;
  timestamp: string;
  action: TradeAction;
  symbol: string;
  market: MarketKind;
  side: TradeSide;
  price: number;
  /** Notional size in USD. */
  size: number;
  /** Realised PnL in USD, present on close / tp / sl. */
  pnl?: number;
  note?: string;
}

/** Events the server pushes to connected clients. */
export interface ServerToClientEvents {
  briefing: (payload: HourlyBriefing) => void;
  trade: (payload: TradeEvent) => void;
}

/** Events clients may send to the server (none yet — reserved for Phase 2). */
export type ClientToServerEvents = Record<string, never>;
