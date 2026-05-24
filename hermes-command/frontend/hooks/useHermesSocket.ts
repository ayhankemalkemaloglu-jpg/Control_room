"use client";

import { useEffect } from "react";

import {
  fetchBriefings,
  fetchClosedTrades,
  fetchOpenPositions,
  fetchStats,
} from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useHermesStore } from "@/lib/store";
import type { HourlyBriefing, Stats, Trade } from "@/types/hermes";

/**
 * Wires the dashboard to the Hermes backend:
 *  1. REST hydration on mount — backfill open/closed trades, stats, briefings.
 *  2. Live socket stream — keep them current as events arrive.
 */
export function useHermesSocket(): void {
  const setConnection = useHermesStore((s) => s.setConnection);
  const pushBriefing = useHermesStore((s) => s.pushBriefing);
  const addOpenPosition = useHermesStore((s) => s.addOpenPosition);
  const closePosition = useHermesStore((s) => s.closePosition);
  const setStats = useHermesStore((s) => s.setStats);
  const setOpenPositions = useHermesStore((s) => s.setOpenPositions);
  const setClosedTrades = useHermesStore((s) => s.setClosedTrades);

  // --- Live socket stream ---
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnection("connected");
    const onDisconnect = () => setConnection("disconnected");
    const onConnectError = () => setConnection("disconnected");
    const onBriefing = (payload: HourlyBriefing) => pushBriefing(payload);
    const onTradeOpen = (trade: Trade) => addOpenPosition(trade);
    const onTradeClose = (trade: Trade) => closePosition(trade);
    const onStats = (stats: Stats) => setStats(stats);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("briefing", onBriefing);
    socket.on("trade:open", onTradeOpen);
    socket.on("trade:close", onTradeClose);
    socket.on("stats:update", onStats);

    setConnection("connecting");
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("briefing", onBriefing);
      socket.off("trade:open", onTradeOpen);
      socket.off("trade:close", onTradeClose);
      socket.off("stats:update", onStats);
      socket.disconnect();
    };
  }, [
    setConnection,
    pushBriefing,
    addOpenPosition,
    closePosition,
    setStats,
  ]);

  // --- REST hydration (runs once on mount) ---
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [open, closed, stats, briefings] = await Promise.all([
          fetchOpenPositions(),
          fetchClosedTrades(),
          fetchStats(),
          fetchBriefings(),
        ]);
        if (cancelled) return;

        setOpenPositions(open);
        setClosedTrades(closed);
        if (stats) setStats(stats);
        // pushBriefing prepends, so replay oldest→newest to keep newest on top.
        [...briefings].reverse().forEach((b) => pushBriefing(b));
      } catch (err) {
        console.warn("[hermes] REST hydration failed", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setOpenPositions, setClosedTrades, setStats, pushBriefing]);
}
