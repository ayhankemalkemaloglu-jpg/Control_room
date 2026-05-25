"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useHermesStore } from "@/lib/store";

export function NewsLayer() {
  const news = useHermesStore((s) => s.news);

  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-[12px] border border-border">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-sm text-foreground">Haber Akışı</h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Kripto
        </span>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 p-4">
          {news.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
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
                    className="size-16 shrink-0 rounded-md object-cover"
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
