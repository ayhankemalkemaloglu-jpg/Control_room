import { parsePositionLine } from "./positions";
import type {
  ParsedBriefing,
  ParsedPosition,
  ParsedSymbol,
  SymbolCategory,
  Trend,
} from "./types";

const HOUR_RE = /Hourly Briefing\s*[—–-]\s*(\d{2}:\d{2})/;
const OVERALL_RE = /Overall:\s+(\w+)\s+\|\s+Leader:\s+(\w+)/;
const AGGR_RE = /Crypto aggr:\s+([\d.]+)\s+\|\s+Stock aggr:\s+([\d.]+)/;
const COUNT_RE = /Open Positions:\s+(\d+)/;
const SYMBOL_RE = /([A-Za-z0-9]+):\s+(\w+)\s+\(aggr\s+([\d.]+)\)/;
const CATEGORY_RE = /^(CRYPTO|STOCKS?|EQUIT(?:Y|IES))$/i;

function trendFromLine(line: string): Trend | null {
  if (line.includes("📈")) return "trend_up";
  if (line.includes("📉")) return "trend_down";
  if (line.includes("➡")) return "range";
  return null;
}

function normalizeCategory(raw: string): SymbolCategory {
  const upper = raw.toUpperCase();
  if (upper.startsWith("CRYPTO")) return "CRYPTO";
  if (upper.startsWith("STOCK") || upper.startsWith("EQUIT")) return "STOCK";
  return "UNKNOWN";
}

function num(value: string | undefined): number | null {
  if (value === undefined) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Parse a raw Hermes hourly-briefing message. Resilient by design: missing
 * fields become null/empty rather than throwing, so a malformed message still
 * yields whatever could be extracted.
 */
export function parseBriefing(message: string): ParsedBriefing {
  const overallMatch = OVERALL_RE.exec(message);
  const aggrMatch = AGGR_RE.exec(message);
  const countMatch = COUNT_RE.exec(message);
  const hourMatch = HOUR_RE.exec(message);

  const symbols: ParsedSymbol[] = [];
  const positions: ParsedPosition[] = [];
  let category: SymbolCategory = "UNKNOWN";

  for (const rawLine of message.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    if (CATEGORY_RE.test(line)) {
      category = normalizeCategory(line);
      continue;
    }

    const trend = trendFromLine(line);
    if (trend) {
      const symbolMatch = SYMBOL_RE.exec(line);
      if (symbolMatch) {
        symbols.push({
          symbol: symbolMatch[1].toUpperCase(),
          category,
          trend,
          aggr: num(symbolMatch[3]) ?? 0,
        });
        continue;
      }
    }

    const position = parsePositionLine(line);
    if (position) positions.push(position);
  }

  return {
    hourLabel: hourMatch ? hourMatch[1] : null,
    overall: overallMatch ? overallMatch[1] : null,
    leader: overallMatch ? overallMatch[2] : null,
    cryptoAggr: aggrMatch ? num(aggrMatch[1]) : null,
    stockAggr: aggrMatch ? num(aggrMatch[2]) : null,
    openPositionsCount: countMatch ? Number.parseInt(countMatch[1], 10) : null,
    symbols,
    positions,
  };
}
