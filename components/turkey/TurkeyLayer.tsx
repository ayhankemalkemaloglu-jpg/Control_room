"use client";

import { useEffect, useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchNews, fetchTurkeyMarkets } from "@/lib/api";
import { deltaColor } from "@/lib/format";
import { sortNewsNewestFirst } from "@/lib/news";
import { cn } from "@/lib/utils";
import type { NewsItem, Quote, TurkeyMarkets } from "@/types/hermes";

function fmt(n: number): string {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function Ticker({ label, q }: { label: string; q: Quote | null | undefined }) {
  const pct = q?.changePct ?? null;
  return (
    <div className="rounded-[10px] border border-border bg-secondary/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-base text-foreground tabular">
        {q ? fmt(q.price) : "—"}
      </div>
      <div
        className={cn(
          "font-mono text-[11px] tabular",
          pct !== null ? deltaColor(pct) : "text-muted-foreground",
        )}
      >
        {pct !== null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
      </div>
    </div>
  );
}

export function TurkeyLayer() {
  const [markets, setMarkets] = useState<TurkeyMarkets | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchTurkeyMarkets().then((m) => {
        if (!cancelled && m) setMarkets(m);
      });
      fetchNews("turkey")
        .then((list) => {
          if (cancelled) return;
          setNews(sortNewsNewestFirst(list));
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-[12px] border border-border">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-sm text-foreground">Türkiye</h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          BIST · Döviz · Altın
        </span>
      </header>

      <div className="grid grid-cols-3 gap-2 p-3">
        <Ticker label="BIST 100" q={markets?.bist100} />
        <Ticker label="USD/TRY" q={markets?.usdtry} />
        <Ticker label="Gram Altın ₺" q={markets?.gold_gram_try} />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 pb-4">
          {news.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              Haber yükleniyor…
            </p>
          ) : (
            news.map((n, i) => (
              <a
                key={`${n.url}-${i}`}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 rounded-[10px] border border-border bg-secondary/30 p-3 transition-colors hover:border-gold/30 hover:bg-secondary/50"
              >
                {n.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.thumbnail}
                    alt=""
                    className="size-14 shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm text-foreground">{n.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="truncate">{n.source}</span>
                    {n.age && <span>· {n.age}</span>}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
