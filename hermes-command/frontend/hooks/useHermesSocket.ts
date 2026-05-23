"use client";

import { useEffect } from "react";

import { getSocket } from "@/lib/socket";
import { useHermesStore } from "@/lib/store";
import type { HourlyBriefing } from "@/types/hermes";

/** Connects to the Hermes backend and streams briefings into the store. */
export function useHermesSocket(): void {
  const setConnection = useHermesStore((s) => s.setConnection);
  const pushBriefing = useHermesStore((s) => s.pushBriefing);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnection("connected");
    const onDisconnect = () => setConnection("disconnected");
    const onConnectError = () => setConnection("disconnected");
    const onBriefing = (payload: HourlyBriefing) => pushBriefing(payload);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("briefing", onBriefing);

    setConnection("connecting");
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("briefing", onBriefing);
      socket.disconnect();
    };
  }, [setConnection, pushBriefing]);
}
