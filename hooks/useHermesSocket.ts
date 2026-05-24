"use client";

import { useEffect } from "react";

import {
  fetchBriefings,
  fetchClosedTrades,
  fetchHealth,
  fetchOpenPositions,
  fetchStats,
} from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useHermesStore } from "@/lib/store";
import type {
  Briefing,
  BriefingNewPayload,
  Trade,
} from "@/types/hermes";

/**
 * Normalise the lighter `briefing:new` socket payload into the store's
 * `Briefing` shape. The ping carries no aggregates or by-symbol rows, so those
 * default to null / `[]` — the next REST hydration (or page reload) backfills
 * the full row.
 */
function briefingFromEvent(p: BriefingNewPayload): Briefing {
  return {
    id: p.briefing_id,
    timestamp: p.timestamp,
    hour_label: p.hour_label,
    overall: p.overall,
    leader: p.leader,
    crypto_aggr: null,
    stock_aggr: null,
    open_positions_count: p.open_positions_count,
    symbols: [],
  };
}

/**
 * Wires the dashboard to the live Hermes backend (localhost:4000):
 *  1. REST hydration on mount — backfill open/closed trades, stats, briefings.
 *  2. Live socket stream — keep them current as events arrive.
 *
 * Event contract (hermes-backend/src/socket/server.ts + routes/webhook.ts):
 *   briefing:new  → { briefing_id, hour_label, timestamp, overall, leader, open_positions_count }
 *   trade:open    → Trade
 *   trade:close   → Trade
 *   stats:update  → { at }   ← a "changed" ping; re-fetch /trades/stats on it.
 */
export function useHermesSocket(): void {
  const setConnection = useHermesStore((s) => s.setConnection);
  const pushBriefing = useHermesStore((s) => s.pushBriefing);
  const addOpenPosition = useHermesStore((s) => s.addOpenPosition);
  const closePosition = useHermesStore((s) => s.closePosition);
  const setStats = useHermesStore((s) => s.setStats);
  const setHealth = useHermesStore((s) => s.setHealth);
  const setOpenPositions = useHermesStore((s) => s.setOpenPositions);
  const setClosedTrades = useHermesStore((s) => s.setClosedTrades);

  // --- Live socket stream ---
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnection("connected");
    const onDisconnect = () => setConnection("disconnected");
    const onConnectError = () => setConnection("disconnected");
    const onBriefing = (payload: BriefingNewPayload) =>
      pushBriefing(briefingFromEvent(payload));
    const onTradeOpen = (trade: Trade) => addOpenPosition(trade);
    const onTradeClose = (trade: Trade) => closePosition(trade);
    // stats:update only signals "something changed" — pull the fresh numbers.
    const onStatsPing = async () => {
      const fresh = await fetchStats();
      if (fresh) setStats(fresh);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("briefing:new", onBriefing);
    socket.on("trade:open", onTradeOpen);
    socket.on("trade:close", onTradeClose);
    socket.on("stats:update", onStatsPing);

    setConnection("connecting");
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("briefing:new", onBriefing);
      socket.off("trade:open", onTradeOpen);
      socket.off("trade:close", onTradeClose);
      socket.off("stats:update", onStatsPing);
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

  // --- Health polling (drives the bottom-bar status LEDs) ---
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const health = await fetchHealth();
      if (!cancelled) setHealth(health);
    };

    void poll();
    const id = window.setInterval(() => void poll(), 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [setHealth]);
}
