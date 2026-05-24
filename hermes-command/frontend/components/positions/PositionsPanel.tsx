"use client";

import { Panel } from "@/components/common/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  deltaColor,
  formatPrice,
  formatSignedPct,
  formatSignedUsd,
  shortSymbol,
} from "@/lib/format";
import { useHermesStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/hermes";

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

function PositionRow({ position }: { position: Trade }) {
  const long = position.side === "LONG";
  const { pnl_pct: pnlPct, pnl_usd: pnlUsd } = position;
  return (
    <article className="rounded-[12px] border border-border bg-secondary/30 p-3">
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
            pnlUsd !== null ? deltaColor(pnlUsd) : "text-neutral",
          )}
        >
          {pnlUsd !== null ? formatSignedUsd(pnlUsd) : "—"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Giriş" value={formatPrice(position.entry_price)} />
        <Stat label="Strateji" value={formatStrategy(position.strategy)} />
        <Stat
          label="PnL %"
          value={pnlPct !== null ? formatSignedPct(pnlPct) : "—"}
          valueClass={pnlPct !== null ? deltaColor(pnlPct) : undefined}
        />
      </div>
    </article>
  );
}

export function PositionsPanel() {
  const openPositions = useHermesStore((s) => s.openPositions);

  return (
    <Panel
      title="Açık Pozisyonlar"
      eyebrow={`${openPositions.length} pozisyon`}
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
              <PositionRow key={position.id} position={position} />
            ))
          )}
        </div>
      </ScrollArea>
    </Panel>
  );
}
