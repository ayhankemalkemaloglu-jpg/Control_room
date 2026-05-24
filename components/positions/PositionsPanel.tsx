"use client";

import { Panel } from "@/components/common/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  deltaColor,
  formatPrice,
  formatSignedPct,
  shortSymbol,
} from "@/lib/format";
import { useHermesStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { LivePnlPosition, Trade } from "@/types/hermes";


function formatStrategy(strategy: string | null | undefined): string {
  if (!strategy) return "—";
  return strategy!
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={cn("font-mono text-xs text-foreground tabular", valueClass)}>
        {value}
      </span>
    </div>
  );
}

function PositionRow({
  position,
  live,
}: {
  position: Trade;
  live?: LivePnlPosition;
}) {
  const openChart = useHermesStore((s) => s.openChart);
  const long = position.side === "LONG";
  // Prefer the live unrealized P&L for open positions; fall back to the stored
  // (close-time) value so closed/unpriced rows still render something.
  const pnlPct = live?.pnl_pct ?? position.pnl_pct;
  const currentPrice = live?.current_price ?? null;

  return (
    <button
      type="button"
      onClick={() =>
        openChart({
          symbol: position.symbol,
          entryPrice: position.entry_price,
          side: position.side,
          strategy: position.strategy,
        })
      }
      title={`${shortSymbol(position.symbol)} grafiğini aç`}
      className="w-full rounded-[12px] border border-border bg-secondary/30 p-3 text-left transition-colors hover:border-gold/30 hover:bg-secondary/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-foreground tabular">
            {shortSymbol(position.symbol)}
          </span>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-medium",
              long
                ? "border-bullish/30 text-bullish"
                : "border-bearish/30 text-bearish",
            )}
          >
            {position.side}
          </span>
        </div>
        <span
          className={cn(
            "font-mono text-sm tabular",
            pnlPct !== null ? deltaColor(pnlPct) : "text-neutral",
          )}
        >
          {pnlPct !== null ? formatSignedPct(pnlPct) : "—"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Giriş" value={formatPrice(position.entry_price)} />
        <Stat label="Strateji" value={formatStrategy(position.strategy)} />
        <Stat
          label="Güncel"
          value={currentPrice !== null ? formatPrice(currentPrice) : "—"}
        />
      </div>
    </button>
  );
}

export function PositionsPanel() {
  const openPositions = useHermesStore((s) => s.openPositions);
  const livePnl = useHermesStore((s) => s.livePnl);
  const liveTotal = useHermesStore((s) => s.liveTotalPnlPct);

  return (
    <Panel
      title="Açık Pozisyonlar"
      eyebrow={`${openPositions.length} pozisyon`}
      headerRight={
        liveTotal !== null ? (
          <span
            className={cn(
              "font-mono text-xs tabular",
              deltaColor(liveTotal),
            )}
          >
            {formatSignedPct(liveTotal)}
          </span>
        ) : undefined
      }
      className="h-full"
    >
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-2 p-3">
          {openPositions.length === 0 ? (
            <p className="px-1 py-8 text-center text-xs text-muted-foreground">
              Açık pozisyon yok
            </p>
          ) : (
            openPositions.map((position) => (
              <PositionRow
                key={position.id}
                position={position}
                live={livePnl[position.id]}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </Panel>
  );
}
