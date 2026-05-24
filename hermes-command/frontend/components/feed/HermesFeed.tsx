"use client";

import { AnimatePresence, motion } from "framer-motion";

import { Panel } from "@/components/common/Panel";
import { SentimentPill } from "@/components/common/SentimentPill";
import { ScrollArea } from "@/components/ui/scroll-area";
import { deltaColor, formatHM, formatSignedPct } from "@/lib/format";
import { useHermesStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { HourlyBriefing } from "@/types/hermes";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function BriefingCard({ briefing }: { briefing: HourlyBriefing }) {
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
          {formatHM(briefing.timestamp)}
        </span>
      </div>
      <p className="mt-2 text-sm leading-snug text-foreground">
        {briefing.overall.headline}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <SentimentPill
          sentiment={briefing.overall.sentiment}
          score={briefing.overall.score}
        />
        <span className="text-xs text-muted-foreground">
          Lider{" "}
          <span className="font-mono text-foreground tabular">
            {briefing.leader.symbol}
          </span>{" "}
          <span
            className={cn(
              "font-mono tabular",
              deltaColor(briefing.leader.changePct),
            )}
          >
            {formatSignedPct(briefing.leader.changePct)}
          </span>
        </span>
      </div>
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
