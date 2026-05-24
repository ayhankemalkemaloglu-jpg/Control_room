import { db } from "../db/connection";
import type { ParsedPosition, Side } from "../parser/types";
import { holdMinutes, windowCutoffIso } from "../utils/time";
import { getCurrentPrice } from "./binance";

export interface TradeRow {
  id: number;
  symbol: string;
  side: Side;
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
}

const prevSnapshot = db.prepare(`
  SELECT position_hash FROM open_positions_snapshots
  WHERE briefing_id = (SELECT MAX(id) FROM briefings WHERE id < ?)
`);

const upsertOpen = db.prepare(`
  INSERT INTO trades (symbol, side, entry_price, strategy, opened_at, status, position_hash, price_precision_lost)
  VALUES (@symbol, @side, @entry_price, @strategy, @opened_at, 'OPEN', @position_hash, @price_precision_lost)
  ON CONFLICT(position_hash) DO UPDATE SET
    status = 'OPEN',
    opened_at = excluded.opened_at,
    closed_at = NULL,
    exit_price = NULL,
    pnl_pct = NULL,
    pnl_usd = NULL,
    hold_minutes = NULL,
    realized_r = NULL,
    entry_price = excluded.entry_price,
    strategy = excluded.strategy,
    price_precision_lost = excluded.price_precision_lost
`);

const findOpenByHash = db.prepare(
  "SELECT * FROM trades WHERE position_hash = ? AND status = 'OPEN'",
);
const getTradeById = db.prepare("SELECT * FROM trades WHERE id = ?");
const closeTrade = db.prepare(`
  UPDATE trades
  SET status = @status, exit_price = @exit_price, pnl_pct = @pnl_pct,
      closed_at = @closed_at, hold_minutes = @hold_minutes
  WHERE id = @id
`);
const insertEvent = db.prepare(
  "INSERT INTO events (type, symbol, data_json) VALUES (?, ?, ?)",
);

export interface DiffResult {
  openedCount: number;
  closedCount: number;
  openedTrades: TradeRow[];
  closedTrades: TradeRow[];
}

/**
 * Diff the previous briefing's open positions against the new ones:
 * new hashes open trades, vanished hashes close them (exit price from Binance).
 */
export async function processDiff(
  newBriefingId: number,
  newPositions: ParsedPosition[],
  briefingTs: string,
): Promise<DiffResult> {
  const prevRows = prevSnapshot.all(newBriefingId) as Array<{
    position_hash: string;
  }>;
  const oldHashes = new Set(prevRows.map((r) => r.position_hash));
  const newHashes = new Set(newPositions.map((p) => p.positionHash));

  const toOpen = newPositions.filter((p) => !oldHashes.has(p.positionHash));
  const openTx = db.transaction((positions: ParsedPosition[]): TradeRow[] => {
    const rows: TradeRow[] = [];
    for (const pos of positions) {
      upsertOpen.run({
        symbol: pos.symbol,
        side: pos.side,
        entry_price: pos.entryPrice,
        strategy: pos.strategy,
        opened_at: briefingTs,
        position_hash: pos.positionHash,
        price_precision_lost: pos.precisionLost ? 1 : 0,
      });
      const row = findOpenByHash.get(pos.positionHash) as TradeRow;
      rows.push(row);
      insertEvent.run("TRADE_OPEN", pos.symbol, JSON.stringify(row));
    }
    return rows;
  });
  const openedTrades = openTx(toOpen);

  const closedHashes = [...oldHashes].filter((h) => !newHashes.has(h));
  const closedTrades: TradeRow[] = [];
  for (const hash of closedHashes) {
    const open = findOpenByHash.get(hash) as TradeRow | undefined;
    if (!open) continue;

    const exitPrice = await getCurrentPrice(open.symbol);
    const status = exitPrice === null ? "CLOSED_NO_EXIT" : "CLOSED";

    let pnlPct: number | null = null;
    if (exitPrice !== null && open.entry_price > 0) {
      pnlPct =
        open.side === "LONG"
          ? ((exitPrice - open.entry_price) / open.entry_price) * 100
          : ((open.entry_price - exitPrice) / open.entry_price) * 100;
      pnlPct = Math.round(pnlPct * 10000) / 10000;
    }

    closeTrade.run({
      id: open.id,
      status,
      exit_price: exitPrice,
      pnl_pct: pnlPct,
      closed_at: briefingTs,
      hold_minutes: holdMinutes(open.opened_at, briefingTs),
    });

    const row = getTradeById.get(open.id) as TradeRow;
    closedTrades.push(row);
    insertEvent.run("TRADE_CLOSE", open.symbol, JSON.stringify(row));
  }

  return {
    openedCount: openedTrades.length,
    closedCount: closedTrades.length,
    openedTrades,
    closedTrades,
  };
}

/* ---------------- Stats ---------------- */

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

interface GroupStat {
  key: string;
  count: number;
  win_rate: number;
  total_pnl: number;
}

export interface TradeStats {
  window: string;
  total_trades: number;
  open_count: number;
  closed_count: number;
  win_rate: number;
  win_loss_ratio: number | null;
  avg_pnl_pct: number;
  total_pnl_pct: number;
  profit_factor: number | null;
  by_symbol: Array<{ symbol: string } & Omit<GroupStat, "key">>;
  by_strategy: Array<{ strategy: string } & Omit<GroupStat, "key">>;
}

function groupBy(
  rows: TradeRow[],
  keyFn: (row: TradeRow) => string,
): GroupStat[] {
  const map = new Map<string, { count: number; wins: number; total: number }>();
  for (const row of rows) {
    if (row.pnl_pct === null) continue;
    const key = keyFn(row);
    const agg = map.get(key) ?? { count: 0, wins: 0, total: 0 };
    agg.count += 1;
    if (row.pnl_pct > 0) agg.wins += 1;
    agg.total += row.pnl_pct;
    map.set(key, agg);
  }
  return [...map.entries()]
    .map(([key, agg]) => ({
      key,
      count: agg.count,
      win_rate: agg.count > 0 ? round(agg.wins / agg.count, 4) : 0,
      total_pnl: round(agg.total),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getStats(window: string): TradeStats {
  const cutoff = windowCutoffIso(window);
  const closedRows = (
    cutoff
      ? db
          .prepare(
            "SELECT * FROM trades WHERE status IN ('CLOSED','CLOSED_NO_EXIT') AND closed_at >= ?",
          )
          .all(cutoff)
      : db
          .prepare(
            "SELECT * FROM trades WHERE status IN ('CLOSED','CLOSED_NO_EXIT')",
          )
          .all()
  ) as TradeRow[];

  const openCount = (
    db.prepare("SELECT COUNT(*) AS c FROM trades WHERE status = 'OPEN'").get() as {
      c: number;
    }
  ).c;

  const withPnl = closedRows.filter((r) => r.pnl_pct !== null);
  const wins = withPnl.filter((r) => (r.pnl_pct as number) > 0).length;
  const losses = withPnl.filter((r) => (r.pnl_pct as number) < 0).length;

  const grossProfit = withPnl
    .filter((r) => (r.pnl_pct as number) > 0)
    .reduce((sum, r) => sum + (r.pnl_pct as number), 0);
  const grossLoss = withPnl
    .filter((r) => (r.pnl_pct as number) < 0)
    .reduce((sum, r) => sum + Math.abs(r.pnl_pct as number), 0);
  const totalPnl = withPnl.reduce((sum, r) => sum + (r.pnl_pct as number), 0);

  return {
    window,
    total_trades: openCount + closedRows.length,
    open_count: openCount,
    closed_count: closedRows.length,
    win_rate: withPnl.length > 0 ? round(wins / withPnl.length, 4) : 0,
    win_loss_ratio: losses > 0 ? round(wins / losses) : wins > 0 ? null : 0,
    avg_pnl_pct: withPnl.length > 0 ? round(totalPnl / withPnl.length) : 0,
    total_pnl_pct: round(totalPnl),
    profit_factor:
      grossLoss > 0 ? round(grossProfit / grossLoss) : grossProfit > 0 ? null : 0,
    by_symbol: groupBy(closedRows, (r) => r.symbol).map(({ key, ...rest }) => ({
      symbol: key,
      ...rest,
    })),
    by_strategy: groupBy(closedRows, (r) => r.strategy ?? "unknown").map(
      ({ key, ...rest }) => ({ strategy: key, ...rest }),
    ),
  };
}
