"use client";

import { useNow } from "@/hooks/useNow";
import { deltaColor, formatClock, formatSignedPct } from "@/lib/format";
import { useHermesStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/types/hermes";

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

/** Age-based LED: fresh → ok, getting old → warn, stale → down, unknown → idle. */
function freshnessLed(
  lastIso: string | null,
  now: Date | null,
  okMinutes: number,
  warnMinutes: number,
): LedState {
  if (!lastIso || !now) return "idle";
  const ageMin = (now.getTime() - new Date(lastIso).getTime()) / 60_000;
  if (Number.isNaN(ageMin)) return "idle";
  if (ageMin <= okMinutes) return "ok";
  if (ageMin <= warnMinutes) return "warn";
  return "down";
}

function PnlBand() {
  const stats = useHermesStore((s) => s.stats);
  const totalPct = stats?.total_pnl_pct ?? null;

  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Toplam PnL
      </span>
      <span
        className={cn(
          "font-mono text-base font-medium tabular",
          totalPct !== null ? deltaColor(totalPct) : "text-neutral",
        )}
      >
        {totalPct !== null ? formatSignedPct(totalPct) : "—"}
      </span>
    </div>
  );
}

function SystemHealth() {
  const connection = useHermesStore((s) => s.connection);
  const health = useHermesStore((s) => s.health);
  const latestBriefing = useHermesStore((s) => s.latestBriefing);
  // Re-evaluate freshness on a slow tick so LEDs age even with no new events.
  const now = useNow(15_000);

  // Most recent briefing time we know of: live socket beats the polled /health.
  const lastBriefingIso =
    latestBriefing?.timestamp ?? health?.last_briefing_at ?? null;

  // Veri (data/DB): backend reachable + DB healthy.
  const veriLed: LedState =
    health === null ? "down" : health.db_ok ? "ok" : "warn";

  // Telegram: did this hour's briefing get delivered (hourly cadence).
  const telegramLed = freshnessLed(lastBriefingIso, now, 75, 150);

  // Motor (Hermes engine producing briefings) over a looser window.
  const motorLed: LedState =
    health === null
      ? "down"
      : !lastBriefingIso
        ? "warn"
        : freshnessLed(lastBriefingIso, now, 120, 240);

  const leds: { label: string; state: LedState }[] = [
    { label: "Socket", state: socketLed(connection) },
    { label: "Telegram", state: telegramLed },
    { label: "Veri", state: veriLed },
    { label: "Motor", state: motorLed },
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
