"use client";

import { AnimatePresence, motion } from "framer-motion";

import { Panel } from "@/components/common/Panel";
import { SentimentPill } from "@/components/common/SentimentPill";
import { ScrollArea } from "@/components/ui/scroll-area";
import { deltaColor, formatHM, formatSignedPct } from "@/lib/format";
import { MOCK_FEED } from "@/lib/mock";
import { useHermesStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { HermesMessage, HourlyBriefing } from "@/types/hermes";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const LEVEL_META: Record<
  HermesMessage["level"],
  { label: string; dot: string }
> = {
  signal: { label: "Sinyal", dot: "bg-gold" },
  alert: { label: "Uyarı", dot: "bg-bearish" },
  success: { label: "Başarılı", dot: "bg-bullish" },
  info: { label: "Bilgi", dot: "bg-muted-foreground" },
  warning: { label: "Dikkat", dot: "bg-gold" },
};

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

function FeedMessage({ message }: { message: HermesMessage }) {
  const meta = LEVEL_META[message.level];
  return (
    <article className="border-b border-border px-1 py-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", meta.dot)} />
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {meta.label}
          </span>
          {message.symbol && (
            <span className="font-mono text-[10px] text-muted-foreground tabular">
              {message.symbol}
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-muted-foreground tabular">
          {formatHM(message.timestamp)}
        </span>
      </div>
      <h3 className="mt-1.5 text-sm font-medium text-foreground">
        {message.title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {message.body}
      </p>
    </article>
  );
}

export function HermesFeed() {
  const briefings = useHermesStore((s) => s.briefings);

  return (
    <Panel title="Hermes Feed" eyebrow="Canlı akış" className="h-full">
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-2 p-3">
          <AnimatePresence initial={false}>
            {briefings.map((briefing) => (
              <BriefingCard key={briefing.id} briefing={briefing} />
            ))}
          </AnimatePresence>
          {briefings.length > 0 && <div className="my-1 h-px bg-border" />}
          <div className="flex flex-col">
            {MOCK_FEED.map((message) => (
              <FeedMessage key={message.id} message={message} />
            ))}
          </div>
        </div>
      </ScrollArea>
    </Panel>
  );
}
