import { createHash } from "node:crypto";

import type { ParsedPosition, Side } from "./types";

const POSITION_RE = /(\w+)\s+(LONG|SHORT)\s+@\s+([\d.]+)\s+\[?(\w+)\]?/;

export function positionHash(
  symbol: string,
  side: Side,
  rawPrice: string,
  strategy: string,
): string {
  return createHash("md5")
    .update(`${symbol}|${side}|${rawPrice}|${strategy}`)
    .digest("hex");
}

/** Parse a single "SYMBOL LONG @ price strategy" line, or null if it isn't one. */
export function parsePositionLine(line: string): ParsedPosition | null {
  const match = POSITION_RE.exec(line.trim());
  if (!match) return null;

  const symbol = match[1].toUpperCase();
  const side = match[2] as Side;
  const rawPrice = match[3];
  const strategy = match[4];

  const parsedPrice = Number.parseFloat(rawPrice);
  const entryPrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;
  const precisionLost = entryPrice === 0;

  return {
    symbol,
    side,
    entryPrice,
    rawPrice,
    strategy,
    positionHash: positionHash(symbol, side, rawPrice, strategy),
    precisionLost,
  };
}
