"use client";

import { Panel } from "@/components/common/Panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  deltaColor,
  formatPrice,
  formatSignedPct,
  formatSignedUsd,
  sideLabel,
} from "@/lib/format";
import { MOCK_POSITIONS } from "@/lib/mock";
import { cn } from "@/lib/utils";
import type { Position } from "@/types/hermes";

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

function PositionRow({ position }: { position: Position }) {
  const long = position.side === "long";
  return (
    <article className="rounded-[12px] border border-border bg-secondary/30 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-foreground tabular">
            {position.symbol}
          </span>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-medium",
              long
                ? "border-bullish/30 text-bullish"
                : "border-bearish/30 text-bearish",
            )}
          >
            {sideLabel(position.side)} {position.leverage}×
          </span>
        </div>
        <span
          className={cn(
            "font-mono text-sm tabular",
            deltaColor(position.pnl),
          )}
        >
          {formatSignedUsd(position.pnl)}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Giriş" value={formatPrice(position.entryPrice)} />
        <Stat label="Son" value={formatPrice(position.markPrice)} />
        <Stat
          label="PnL %"
          value={formatSignedPct(position.pnlPct)}
          valueClass={deltaColor(position.pnlPct)}
        />
      </div>
    </article>
  );
}

export function PositionsPanel() {
  return (
    <Panel
      title="Açık Pozisyonlar"
      eyebrow={`${MOCK_POSITIONS.length} pozisyon`}
      className="h-full"
    >
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-2 p-3">
          {MOCK_POSITIONS.map((position) => (
            <PositionRow key={position.id} position={position} />
          ))}
        </div>
      </ScrollArea>
    </Panel>
  );
}
