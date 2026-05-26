"use client";

import { useState } from "react";

import { StatsModal } from "@/components/stats/StatsModal";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { deltaColor, formatSignedPct } from "@/lib/format";
import { useHermesStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/types/hermes";

const CONNECTION_META: Record<
  ConnectionStatus,
  { label: string; dot: string; pulse: boolean }
> = {
  connected: { label: "Bağlı", dot: "bg-bullish", pulse: false },
  connecting: { label: "Bağlanıyor", dot: "bg-gold", pulse: true },
  disconnected: { label: "Bağlantı yok", dot: "bg-bearish", pulse: false },
};

function Metric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className={cn("font-mono text-xs text-foreground tabular", valueClass)}>
        {value}
      </span>
    </div>
  );
}

function TopMetrics() {
  const liveTotal = useHermesStore((s) => s.liveTotalPnlPct);
  const stats = useHermesStore((s) => s.stats);

  return (
    <div className="flex items-center gap-6">
      <Metric
        label="Net (canlı)"
        value={liveTotal !== null ? formatSignedPct(liveTotal) : "—"}
        valueClass={liveTotal !== null ? deltaColor(liveTotal) : undefined}
      />
      <Metric
        label="24s Ort."
        value={stats ? formatSignedPct(stats.avg_pnl_pct) : "—"}
        valueClass={stats ? deltaColor(stats.avg_pnl_pct) : undefined}
      />
      <Metric
        label="Win"
        value={stats ? `${Math.round(stats.win_rate * 100)}%` : "—"}
        valueClass={stats ? "text-bullish" : undefined}
      />
      <Metric
        label="Lose"
        value={stats ? `${Math.round(stats.loss_rate * 100)}%` : "—"}
        valueClass={stats ? "text-bearish" : undefined}
      />
      <Metric
        label="Açık / Kapalı"
        value={stats ? `${stats.open_count} / ${stats.closed_count}` : "—"}
      />
    </div>
  );
}

export function TopBar() {
  const connection = useHermesStore((s) => s.connection);
  const meta = CONNECTION_META[connection];
  const [statsOpen, setStatsOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          Hermes
        </span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Command Center
        </span>
      </div>

      <TopMetrics />

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => setStatsOpen(true)}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Performans
        </button>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-1.5 rounded-full",
              meta.dot,
              meta.pulse && "live-dot",
            )}
          />
          <span className="text-xs text-muted-foreground">{meta.label}</span>
        </div>
        <VoiceButton />
      </div>

      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />
    </header>
  );
}
