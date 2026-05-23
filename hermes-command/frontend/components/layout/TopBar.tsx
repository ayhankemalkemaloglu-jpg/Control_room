"use client";

import { VoiceButton } from "@/components/voice/VoiceButton";
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

export function TopBar() {
  const connection = useHermesStore((s) => s.connection);
  const meta = CONNECTION_META[connection];

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

      <div className="flex items-center gap-5">
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
    </header>
  );
}
