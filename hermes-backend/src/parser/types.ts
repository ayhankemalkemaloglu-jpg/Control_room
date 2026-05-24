export type Trend = "range" | "trend_up" | "trend_down";

export type Side = "LONG" | "SHORT";

export type SymbolCategory = "CRYPTO" | "STOCK" | "UNKNOWN";

export interface ParsedSymbol {
  symbol: string;
  category: SymbolCategory;
  trend: Trend;
  aggr: number;
}

export interface ParsedPosition {
  symbol: string;
  side: Side;
  entryPrice: number;
  /** Original price token, used for a stable hash across briefings. */
  rawPrice: string;
  strategy: string;
  positionHash: string;
  /** True when the briefing reported "0.0000" (precision lost). */
  precisionLost: boolean;
}

export interface ParsedBriefing {
  hourLabel: string | null;
  overall: string | null;
  leader: string | null;
  cryptoAggr: number | null;
  stockAggr: number | null;
  openPositionsCount: number | null;
  symbols: ParsedSymbol[];
  positions: ParsedPosition[];
}
