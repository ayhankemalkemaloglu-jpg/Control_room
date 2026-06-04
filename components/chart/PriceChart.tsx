"use client";

import { useEffect, useRef, useState } from "react";
import {
  ColorType,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

import { fetchKlines } from "@/lib/api";
import type { Candle, ChartTimeframe } from "@/types/hermes";

interface PriceChartProps {
  symbol: string;
  timeframe: ChartTimeframe;
  /** Draws a dashed "entry" price line when provided (from a position). */
  entryPrice?: number;
}

type Status = "loading" | "ready" | "empty" | "error";

/** How often the open chart re-polls the latest candle for live movement. */
const LIVE_REFRESH_MS = 10_000;

function toBar(c: Candle) {
  return {
    time: c.time as UTCTimestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  };
}

export function PriceChart({ symbol, timeframe, entryPrice }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  // Create the chart once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#b9b2a4", // warm muted, fits black+gold
        fontFamily:
          "var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace",
      },
      grid: {
        vertLines: { color: "rgba(201,169,97,0.05)" },
        horzLines: { color: "rgba(201,169,97,0.05)" },
      },
      rightPriceScale: { borderColor: "rgba(201,169,97,0.12)" },
      timeScale: {
        borderColor: "rgba(201,169,97,0.12)",
        timeVisible: true,
        secondsVisible: false,
      },
    });
    // Black + gold candle palette: bright champagne gold for up, dim bronze for
    // down — keeps up/down legible while staying on-theme with the shader.
    const series = chart.addCandlestickSeries({
      upColor: "#c9a961",
      downColor: "#6e6356",
      borderUpColor: "#d8bd7a",
      borderDownColor: "#857a68",
      wickUpColor: "#d8bd7a",
      wickDownColor: "#857a68",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Load history once, then keep the chart live by re-polling the latest
  // candle and updating only the last bar (preserves the user's zoom/pan and
  // appends a fresh bar automatically when a new period opens).
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    const loadInitial = async () => {
      try {
        const candles = await fetchKlines(symbol, timeframe);
        if (cancelled || !seriesRef.current) return;
        if (candles.length === 0) {
          setStatus("empty");
          return;
        }
        seriesRef.current.setData(candles.map(toBar));
        chartRef.current?.timeScale().fitContent();
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    const loadLive = async () => {
      try {
        const candles = await fetchKlines(symbol, timeframe);
        if (cancelled || !seriesRef.current || candles.length === 0) return;
        // update() only accepts the last bar or a newer one, so push just the
        // most recent candle — it updates the forming bar or appends a new one.
        seriesRef.current.update(toBar(candles[candles.length - 1]));
      } catch {
        // transient poll failure — keep the existing data on screen.
      }
    };

    void loadInitial();
    const timer = window.setInterval(() => void loadLive(), LIVE_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [symbol, timeframe]);

  // Draw / refresh the entry-price line once data is in.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || entryPrice === undefined || status !== "ready") return;
    const line = series.createPriceLine({
      price: entryPrice,
      color: "#c9a961",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "Giriş",
    });
    return () => {
      try {
        series.removePriceLine(line);
      } catch {
        // series may already be disposed on unmount — ignore.
      }
    };
  }, [entryPrice, status, symbol, timeframe]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          {status === "loading"
            ? "Yükleniyor…"
            : status === "empty"
              ? "Veri yok"
              : "Grafik yüklenemedi"}
        </div>
      )}
    </div>
  );
}
