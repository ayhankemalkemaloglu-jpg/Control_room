/**
 * Hermes Command Center — shared domain types (frontend copy).
 * The realtime contract here mirrors `backend/src/types.ts`.
 */

export type Sentiment = "bullish" | "bearish" | "neutral";

export type MarketKind = "crypto" | "stock";

export type TradeSide = "long" | "short";

export type TradeAction = "open" | "close" | "increase" | "reduce" | "tp" | "sl";

export interface SentimentBlock {
  sentiment: Sentiment;
  score: number;
  changePct: number;
}

export interface SymbolSnapshot {
  symbol: string;
  name: string;
  market: MarketKind;
  price: number;
  changePct: number;
  sentiment: Sentiment;
  score: number;
}

export interface MarketLeader {
  symbol: string;
  name: string;
  market: MarketKind;
  changePct: number;
}

export interface OverallRead extends SentimentBlock {
  headline: string;
}

export interface HourlyBriefing {
  id: string;
  timestamp: string;
  overall: OverallRead;
  leader: MarketLeader;
  cryptoAggr: SentimentBlock;
  stockAggr: SentimentBlock;
  symbols: SymbolSnapshot[];
}

export interface TradeEvent {
  id: string;
  timestamp: string;
  action: TradeAction;
  symbol: string;
  market: MarketKind;
  side: TradeSide;
  price: number;
  size: number;
  pnl?: number;
  note?: string;
}

/**
 * A persisted trade row from the Hermes backend (open or historical).
 * Mirrors the backend `Trade` shape — note the uppercase `side` and the
 * snake_case fields, which match the DB / wire format verbatim.
 */
export interface Trade {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  strategy: string;
  opened_at: string;
  closed_at: string | null;
  exit_price: number | null;
  pnl_pct: number | null;
  pnl_usd: number | null;
  status: "OPEN" | "CLOSED" | "CLOSED_NO_EXIT";
  hold_minutes: number | null;
  realized_r: number | null;
  /** Stable identity of the position across open/close events. */
  position_hash: string;
  price_precision_lost: number;
}

/** Aggregate trade statistics for the bottom-bar PnL band. */
export interface Stats {
  total_trades: number;
  open_count: number;
  closed_count: number;
  win_rate: number;
  win_loss_ratio: number;
  avg_pnl_pct: number;
  total_pnl_pct: number;
  profit_factor: number;
}

/* ---- Realtime socket contract ---- */

export interface ServerToClientEvents {
  briefing: (payload: HourlyBriefing) => void;
  trade: (payload: TradeEvent) => void;
  "trade:open": (trade: Trade) => void;
  "trade:close": (trade: Trade) => void;
  "stats:update": (stats: Stats) => void;
}

export type ClientToServerEvents = Record<string, never>;

/* ---- Frontend-only view models ---- */

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export type LayerId = "world" | "turkey" | "news";

export type HermesMessageLevel =
  | "info"
  | "signal"
  | "alert"
  | "success"
  | "warning";

export interface HermesMessage {
  id: string;
  timestamp: string;
  level: HermesMessageLevel;
  title: string;
  body: string;
  symbol?: string;
}

export interface Position {
  id: string;
  symbol: string;
  name: string;
  market: MarketKind;
  side: TradeSide;
  entryPrice: number;
  markPrice: number;
  /** Notional size in USD. */
  size: number;
  leverage: number;
  /** Unrealised PnL in USD. */
  pnl: number;
  /** Unrealised PnL, percent of margin. */
  pnlPct: number;
  openedAt: string;
}
