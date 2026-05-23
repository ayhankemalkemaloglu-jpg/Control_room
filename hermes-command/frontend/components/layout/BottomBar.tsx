"use client";

import { useNow } from "@/hooks/useNow";
import {
  deltaColor,
  formatClock,
  formatSignedPct,
  formatSignedUsd,
} from "@/lib/format";
import { MOCK_POSITIONS } from "@/lib/mock";
import { useHermesStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/types/hermes";

const TOTAL_PNL = MOCK_POSITIONS.reduce((sum, p) => sum + p.pnl, 0);
const TOTAL_SIZE = MOCK_POSITIONS.reduce((sum, p) => sum + p.size, 0);
const TOTAL_PCT = (TOTAL_PNL / TOTAL_SIZE) * 100;

const CLOCKS: { label: string; tz: string }[] = [
  { label: "NYC", tz: "America/New_York" },
  { label: "LON", tz: "Europe/London" },
  { label: "IST", tz: "Europe/Istanbul" },
  { label: "TYO", tz: "Asia/Tokyo" },
];

type LedState = "ok" | "warn" | "down" | "idle";

const LED_COLOR: Record<LedState, string> = {
  ok: "bg-bullish",
  warn: "bg-gold",
  down: "bg-bearish",
  idle: "bg-muted-foreground/40",
};

function socketLed(connection: ConnectionStatus): LedState {
  if (connection === "connected") return "ok";
  if (connection === "connecting") return "warn";
  return "down";
}

function PnlBand() {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Gerçekleşmemiş PnL
      </span>
      <span
        className={cn(
          "font-mono text-base font-medium tabular",
          deltaColor(TOTAL_PNL),
        )}
      >
        {formatSignedUsd(TOTAL_PNL)}
      </span>
      <span className={cn("font-mono text-xs tabular", deltaColor(TOTAL_PCT))}>
        {formatSignedPct(TOTAL_PCT)}
      </span>
    </div>
  );
}

function SystemHealth() {
  const connection = useHermesStore((s) => s.connection);
  const leds: { label: string; state: LedState }[] = [
    { label: "Socket", state: socketLed(connection) },
    { label: "Telegram", state: "idle" },
    { label: "Veri", state: "ok" },
    { label: "Motor", state: "ok" },
  ];

  return (
    <div className="flex items-center gap-4">
      {leds.map((led) => (
        <div key={led.label} className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", LED_COLOR[led.state])} />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {led.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function WorldClocks() {
  const now = useNow(1000);
  return (
    <div className="flex items-center gap-5">
      {CLOCKS.map((clock) => (
        <div key={clock.label} className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {clock.label}
          </span>
          <span className="font-mono text-xs text-foreground tabular">
            {now ? formatClock(now, clock.tz) : "--:--:--"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BottomBar() {
  return (
    <footer className="flex h-14 shrink-0 items-center justify-between gap-6 border-t border-border px-6">
      <PnlBand />
      <SystemHealth />
      <WorldClocks />
    </footer>
  );
}
