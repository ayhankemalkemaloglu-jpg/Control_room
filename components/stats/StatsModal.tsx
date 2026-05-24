"use client";

import { useEffect, useState } from "react";

import { Modal } from "@/components/common/Modal";
import { fetchStats } from "@/lib/api";
import { deltaColor, formatSignedPct, shortSymbol } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GroupStat, Stats, StatsWindow } from "@/types/hermes";

const WINDOWS: StatsWindow[] = ["24h", "7d", "30d", "all"];

function strategyName(key: string): string {
  if (key === "unknown") return "—";
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function GroupTable({
  title,
  rows,
  isSymbol = false,
}: {
  title: string;
  rows: GroupStat[];
  isSymbol?: boolean;
}) {
  const sorted = [...rows].sort((a, b) => b.total_pnl_pct - a.total_pnl_pct);
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <div className="overflow-hidden rounded-[10px] border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Ad</th>
              <th className="px-3 py-2 text-right font-medium">İşlem</th>
              <th className="px-3 py-2 text-right font-medium">Başarı</th>
              <th className="px-3 py-2 text-right font-medium">Ort. %</th>
              <th className="px-3 py-2 text-right font-medium">Toplam %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Veri yok
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.key} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2 font-mono text-foreground">
                    {isSymbol ? shortSymbol(r.key) : strategyName(r.key)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular text-muted-foreground">
                    {r.total_trades}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular text-foreground">
                    {Math.round(r.win_rate * 100)}%
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono tabular",
                      deltaColor(r.avg_pnl_pct),
                    )}
                  >
                    {formatSignedPct(r.avg_pnl_pct)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right font-mono tabular",
                      deltaColor(r.total_pnl_pct),
                    )}
                  >
                    {formatSignedPct(r.total_pnl_pct)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [window, setWindow] = useState<StatsWindow>("24h");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetchStats(window)
      .then((s) => {
        if (!cancelled) {
          setStats(s);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, window]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-2xl"
      title={
        <span className="font-display text-sm text-foreground">
          Strateji Performansı
        </span>
      }
    >
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindow(w)}
              className={cn(
                "rounded px-2 py-1 font-mono text-[11px] transition-colors",
                w === window
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {w}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Yükleniyor…</p>
        ) : !stats ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Veri yok</p>
        ) : (
          <>
            <GroupTable title="Stratejiye göre" rows={stats.by_strategy} />
            <GroupTable title="Sembole göre" rows={stats.by_symbol} isSymbol />
          </>
        )}
      </div>
    </Modal>
  );
}
