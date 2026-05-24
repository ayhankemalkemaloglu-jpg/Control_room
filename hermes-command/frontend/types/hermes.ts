/**
 * Hermes Command Center — shared domain types (frontend copy).
 *
 * These mirror the LIVE backend wire format verbatim:
 *   - snake_case fields and uppercase trade sides (DB / JSON shape), and
 *   - the exact Socket.io event names the backend emits.
 *
 * Source of truth:
 *   hermes-backend/src/services/trades.ts      (TradeRow, TradeStats, GroupStat)
 *   hermes-backend/src/services/briefings.ts   (BriefingRow, BriefingSymbolRow)
 *   hermes-backend/src/socket/server.ts        (broadcast event names)
 *   hermes-backend/src/routes/webhook.ts       (briefing:new / stats:update payloads)
 */

/* ---- Sentiment (frontend-only; drives the feed pill colour) ---- */

export type Sentiment = "bullish" | "bearish" | "neutral";

export type TradeSide = "long" | "short";

/* ---- Briefings ---- */

/** Normalised trend, derived backend-side from a symbol line's leading emoji. */
export type Trend = "range" | "trend_up" | "trend_down";

/** One by-symbol row attached to a briefing (present on REST rows only). */
export interface BriefingSymbol {
  symbol: string;
  category: string;
  trend: Trend;
  aggr: number;
}

/**
 * A briefing as held in the store. Unifies the two backend sources:
 *   - REST `GET /briefings` rows — full: crypto/stock aggr + symbols, and
 *   - the `briefing:new` socket ping — lighter: no aggr, no symbols.
 * Fields absent from the socket payload are nullable / default to `[]`.
 */
export interface Briefing {
  id: number;
  timestamp: string;
  hour_label: string | null;
  overall: string | null;
  leader: string | null;
  crypto_aggr: number | null;
  stock_aggr: number | null;
  open_positions_count: number | null;
  symbols: BriefingSymbol[];
}

/* ---- Trades (backend services/trades.ts → TradeRow) ---- */

/**
 * A persisted trade row from the Hermes backend (open or historical).
 * snake_case + uppercase `side` match the DB / wire format verbatim.
 */
export interface Trade {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  strategy: string | null;
  opened_at: string;
  closed_at: string | null;
  exit_price: number | null;
  pnl_pct: number | null;
  pnl_usd: number | null;
  status: "OPEN" | "CLOSED" | "CLOSED_NO_EXIT";
  hold_minutes: number | null;
  realized_r: number | null;
  /** Stable identity of the position across its open/close events. */
  position_hash: string;
  /** 0 | 1 — SQLite has no boolean; the backend stores the flag as an int. */
  price_precision_lost: number;
}

/* ---- Stats (backend services/trades.ts → TradeStats) ---- */

export type StatsWindow = "24h" | "7d" | "30d" | "all";

/** A by-symbol / by-strategy breakdown row inside `Stats`. */
export interface GroupStat {
  key: string;
  total_trades: number;
  closed_count: number;
  win_rate: number;
  avg_pnl_pct: number;
  total_pnl_pct: number;
}

/** Aggregate trade statistics for the bottom-bar PnL band. */
export interface Stats {
  window: StatsWindow;
  total_trades: number;
  open_count: number;
  closed_count: number;
  win_rate: number;
  /** null when there are no losses yet — backend avoids non-serialisable Infinity. */
  win_loss_ratio: number | null;
  avg_pnl_pct: number;
  total_pnl_pct: number;
  /** null when gross loss is 0. */
  profit_factor: number | null;
  by_symbol: GroupStat[];
  by_strategy: GroupStat[];
}

/* ---- Realtime socket contract (backend socket/server.ts broadcasts) ---- */

/** Payload of `briefing:new` — lighter than a REST briefing row. */
export interface BriefingNewPayload {
  briefing_id: number;
  hour_label: string | null;
  timestamp: string;
  overall: string | null;
  leader: string | null;
  open_positions_count: number | null;
}

/**
 * Payload of `stats:update` — a "stats changed" ping, NOT the stats object.
 * On receipt the client should re-fetch `GET /trades/stats`.
 */
export interface StatsUpdatePayload {
  at: string;
}

export interface ServerToClientEvents {
  "briefing:new": (payload: BriefingNewPayload) => void;
  "trade:open": (trade: Trade) => void;
  "trade:close": (trade: Trade) => void;
  "stats:update": (payload: StatsUpdatePayload) => void;
}

export type ClientToServerEvents = Record<string, never>;

/* ---- Frontend-only view models ---- */

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export type LayerId = "world" | "turkey" | "news";
