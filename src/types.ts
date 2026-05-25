// Shapes mirror the Hermes backend REST + Socket.io payloads.

export type Market = 'CRYPTO' | 'BIST';
export type StatsWindow = '24h' | '7d' | '30d' | 'all';

export interface Trade {
  id: number;
  symbol: string;
  side: string;
  entry_price: number;
  strategy: string | null;
  opened_at: string;
  closed_at: string | null;
  exit_price: number | null;
  pnl_pct: number | null;
  pnl_usd: number | null;
  status: string;
  hold_minutes: number | null;
  realized_r: number | null;
  position_hash: string;
  price_precision_lost: number;
  entry_price_display: string;
  exit_price_display: string | null;
  market: Market;
  risk_breach?: { reason: string; detail?: unknown };
}

export interface GroupStat {
  key: string;
  total_trades: number;
  closed_count: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
  loss_rate: number;
  avg_pnl_pct: number;
  total_pnl_pct: number;
}

export interface TradeStats {
  window: StatsWindow;
  total_trades: number;
  open_count: number;
  closed_count: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
  loss_rate: number;
  win_loss_ratio: number | null;
  avg_pnl_pct: number;
  total_pnl_pct: number;
  profit_factor: number | null;
  by_symbol: GroupStat[];
  by_strategy: GroupStat[];
}

export interface LivePosition {
  trade_id: number;
  symbol: string;
  side: string;
  market: Market;
  entry_price: number;
  entry_price_display: string;
  current_price: number | null;
  current_price_display: string | null;
  pnl_pct: number | null;
  strategy: string | null;
}

export interface PnlUpdate {
  at: string;
  positions: LivePosition[];
  total_pnl_pct: number;
}

export interface Briefing {
  id: number;
  timestamp: string;
  hour_label: string | null;
  overall: string | null;
  leader: string | null;
  crypto_aggr: number | null;
  stock_aggr: number | null;
  open_positions_count: number | null;
  received_at: string;
}

export interface Health {
  ok: boolean;
  uptime: number;
  db_ok: boolean;
  last_briefing_at: string | null;
  version: string;
}

export type ConnState = 'connecting' | 'connected' | 'disconnected' | 'unauthorized';
