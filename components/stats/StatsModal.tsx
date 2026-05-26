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
              <th className="px-3 py-2 text-right font-medium">Win</th>
              <th className="px-3 py-2 text-right font-medium">Lose</th>
              <th className="px-3 py-2 text-right font-medium">Ort. %</th>
              <th className="px-3 py-2 text-right font-medium">Toplam %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
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
                  <td className="px-3 py-2 text-right font-mono tabular text-bullish">
                    {Math.round(r.win_rate * 100)}%
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular text-bearish">
                    {Math.round(r.loss_rate * 100)}%
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

function Summary({ stats }: { stats: Stats }) {
  const winPct = Math.round(stats.win_rate * 100);
  const lossPct = Math.round(stats.loss_rate * 100);
  const total = stats.win_count + stats.loss_count;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1 rounded-[10px] border border-bullish/25 bg-bullish/5 p-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Win rate
          </span>
          <span className="font-mono text-2xl font-semibold tabular text-bullish">{winPct}%</span>
          <span className="text-[11px] text-muted-foreground">{stats.win_count} kazanç</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[10px] border border-bearish/25 bg-bearish/5 p-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Lose rate
          </span>
          <span className="font-mono text-2xl font-semibold tabular text-bearish">{lossPct}%</span>
          <span className="text-[11px] text-muted-foreground">{stats.loss_count} kayıp</span>
        </div>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-border">
        <div className="bg-bullish" style={{ width: `${total ? (stats.win_count / total) * 100 : 0}%` }} />
        <div className="bg-bearish" style={{ width: `${total ? (stats.loss_count / total) * 100 : 0}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <Metric label="Toplam P&L" value={formatSignedPct(stats.total_pnl_pct)} tone={stats.total_pnl_pct} />
        <Metric
          label="Profit factor"
          value={stats.profit_factor === null ? "∞" : stats.profit_factor.toFixed(2)}
        />
        <Metric label="Kapanan" value={String(stats.closed_count)} />
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: number }) {
  return (
    <div className="rounded-[10px] border border-border bg-secondary/30 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("font-mono text-sm tabular text-foreground", tone !== undefined && deltaColor(tone))}>
        {value}
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
            <Summary stats={stats} />
            <GroupTable title="Stratejiye göre" rows={stats.by_strategy} />
            <GroupTable title="Sembole göre" rows={stats.by_symbol} isSymbol />
          </>
        )}
      </div>
    </Modal>
  );
}
