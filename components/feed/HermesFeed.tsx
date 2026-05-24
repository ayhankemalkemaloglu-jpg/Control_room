"use client";

import { AnimatePresence, motion } from "framer-motion";

import { Panel } from "@/components/common/Panel";
import { SentimentPill } from "@/components/common/SentimentPill";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatHM, shortSymbol } from "@/lib/format";
import { useHermesStore } from "@/lib/store";
import type { Briefing, Sentiment, Trend } from "@/types/hermes";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * The backend's `overall` is a single word (e.g. "Bullish", "Range"), not a
 * structured sentiment. Map it to a colour bucket for the pill; anything we
 * don't recognise reads as neutral.
 */
function overallSentiment(overall: string | null): Sentiment {
  const w = (overall ?? "").toLowerCase();
  if (w.includes("bull") || w.includes("up") || w.includes("long")) {
    return "bullish";
  }
  if (w.includes("bear") || w.includes("down") || w.includes("short")) {
    return "bearish";
  }
  return "neutral";
}

const TREND_GLYPH: Record<Trend, { icon: string; color: string }> = {
  trend_up: { icon: "▲", color: "text-bullish" },
  trend_down: { icon: "▼", color: "text-bearish" },
  range: { icon: "►", color: "text-neutral" },
};

/** Aggregate scores arrive as floats; render two decimals, em-dash when null. */
function fmtAggr(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-xs text-foreground tabular">{value}</span>
    </div>
  );
}

function BriefingCard({ briefing }: { briefing: Briefing }) {
  const openChart = useHermesStore((s) => s.openChart);
  const sentiment = overallSentiment(briefing.overall);
  const hour = briefing.hour_label ?? formatHM(briefing.timestamp);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="rounded-[12px] border border-gold/15 bg-secondary/40 p-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-gold">
          Saatlik Brifing
        </span>
        <span className="font-mono text-[10px] text-muted-foreground tabular">
          {hour}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <SentimentPill sentiment={sentiment} />
        {briefing.overall && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-foreground">
            {briefing.overall}
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="Kripto" value={fmtAggr(briefing.crypto_aggr)} />
        <MiniStat label="Hisse" value={fmtAggr(briefing.stock_aggr)} />
        <MiniStat
          label="Lider"
          value={briefing.leader ? shortSymbol(briefing.leader) : "—"}
        />
      </div>

      {briefing.symbols.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {briefing.symbols.slice(0, 8).map((s) => {
            const glyph = TREND_GLYPH[s.trend];
            return (
              <button
                key={s.symbol}
                type="button"
                onClick={() => openChart({ symbol: s.symbol })}
                title={`${shortSymbol(s.symbol)} grafiğini aç`}
                className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] tabular transition-colors hover:border-gold/40 hover:bg-secondary/60"
              >
                <span className={glyph.color}>{glyph.icon}</span>
                <span className="text-foreground">{shortSymbol(s.symbol)}</span>
                <span className="text-muted-foreground">{s.aggr.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      )}

      {briefing.open_positions_count !== null && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Açık pozisyon:{" "}
          <span className="font-mono text-foreground tabular">
            {briefing.open_positions_count}
          </span>
        </p>
      )}
    </motion.article>
  );
}

export function HermesFeed() {
  const briefings = useHermesStore((s) => s.briefings);

  return (
    <Panel title="Hermes Feed" eyebrow="Canlı akış" className="h-full">
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-2 p-3">
          {briefings.length === 0 ? (
            <p className="px-1 py-8 text-center text-xs text-muted-foreground">
              Henüz briefing yok
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {briefings.map((briefing) => (
                <BriefingCard key={briefing.id} briefing={briefing} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </Panel>
  );
}
