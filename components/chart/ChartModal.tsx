"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Modal } from "@/components/common/Modal";
import { deltaColor, formatPrice, formatSignedPct, shortSymbol } from "@/lib/format";
import { useHermesStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ChartTimeframe } from "@/types/hermes";

// lightweight-charts touches the DOM, so keep it client-only.
const PriceChart = dynamic(
  () => import("./PriceChart").then((m) => m.PriceChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
        Yükleniyor…
      </div>
    ),
  },
);

const TIMEFRAMES: ChartTimeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

export function ChartModal() {
  const target = useHermesStore((s) => s.chartTarget);
  const closeChart = useHermesStore((s) => s.closeChart);
  const livePnl = useHermesStore((s) => s.livePnl);
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1h");

  if (!target) return null;

  const long = target.side === "LONG";
  // If opened from a position with live P&L, surface the current % in the header.
  const livePct = Object.values(livePnl).find(
    (p) => p.symbol === target.symbol,
  )?.pnl_pct;

  return (
    <Modal
      open
      onClose={closeChart}
      className="h-[72vh] max-w-4xl"
      title={
        <div className="flex items-center gap-2">
          <span className="font-display text-sm text-foreground">
            {shortSymbol(target.symbol)}
          </span>
          {target.side && (
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                long
                  ? "border-bullish/30 text-bullish"
                  : "border-bearish/30 text-bearish",
              )}
            >
              {target.side}
            </span>
          )}
          {target.entryPrice !== undefined && (
            <span className="font-mono text-[11px] text-muted-foreground tabular">
              Giriş {formatPrice(target.entryPrice)}
            </span>
          )}
          {livePct !== undefined && (
            <span className={cn("font-mono text-[11px] tabular", deltaColor(livePct))}>
              {formatSignedPct(livePct)}
            </span>
          )}
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-1 px-4 py-2">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeframe(t)}
              className={cn(
                "rounded px-2 py-1 font-mono text-[11px] transition-colors",
                t === timeframe
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 px-2 pb-3">
          <PriceChart
            symbol={target.symbol}
            timeframe={timeframe}
            entryPrice={target.entryPrice}
          />
        </div>
      </div>
    </Modal>
  );
}
