import { db } from "../db/connection";
import type { ParsedBriefing } from "../parser/types";
import { toIso } from "../utils/time";

const insertBriefing = db.prepare(`
  INSERT INTO briefings
    (timestamp, hour_label, overall, leader, crypto_aggr, stock_aggr, open_positions_count, raw_message)
  VALUES
    (@timestamp, @hour_label, @overall, @leader, @crypto_aggr, @stock_aggr, @open_positions_count, @raw_message)
`);

const insertSymbol = db.prepare(`
  INSERT INTO briefing_symbols (briefing_id, symbol, category, trend, aggr)
  VALUES (@briefing_id, @symbol, @category, @trend, @aggr)
`);

const insertSnapshot = db.prepare(`
  INSERT INTO open_positions_snapshots (briefing_id, symbol, side, entry_price, strategy, position_hash)
  VALUES (@briefing_id, @symbol, @side, @entry_price, @strategy, @position_hash)
`);

const recentBriefings = db.prepare(
  "SELECT * FROM briefings ORDER BY timestamp DESC, id DESC LIMIT ?",
);
const symbolsForBriefing = db.prepare(
  "SELECT symbol, category, trend, aggr FROM briefing_symbols WHERE briefing_id = ?",
);
const lastTimestamp = db.prepare(
  "SELECT MAX(timestamp) AS ts FROM briefings",
);

export interface SaveBriefingResult {
  briefingId: number;
  timestamp: string;
}

export function saveBriefing(
  parsed: ParsedBriefing,
  rawMessage: string,
  timestamp?: string,
): SaveBriefingResult {
  const ts = toIso(timestamp);

  const run = db.transaction((): number => {
    const info = insertBriefing.run({
      timestamp: ts,
      hour_label: parsed.hourLabel,
      overall: parsed.overall,
      leader: parsed.leader,
      crypto_aggr: parsed.cryptoAggr,
      stock_aggr: parsed.stockAggr,
      open_positions_count: parsed.openPositionsCount,
      raw_message: rawMessage,
    });
    const briefingId = Number(info.lastInsertRowid);

    for (const symbol of parsed.symbols) {
      insertSymbol.run({
        briefing_id: briefingId,
        symbol: symbol.symbol,
        category: symbol.category,
        trend: symbol.trend,
        aggr: symbol.aggr,
      });
    }

    for (const position of parsed.positions) {
      insertSnapshot.run({
        briefing_id: briefingId,
        symbol: position.symbol,
        side: position.side,
        entry_price: position.entryPrice,
        strategy: position.strategy,
        position_hash: position.positionHash,
      });
    }

    return briefingId;
  });

  return { briefingId: run(), timestamp: ts };
}

export function getRecentBriefings(limit: number) {
  const rows = recentBriefings.all(limit) as Array<{ id: number }>;
  return rows.map((row) => ({
    ...row,
    symbols: symbolsForBriefing.all(row.id),
  }));
}

export function getLastBriefingTimestamp(): string | null {
  const row = lastTimestamp.get() as { ts: string | null };
  return row?.ts ?? null;
}
