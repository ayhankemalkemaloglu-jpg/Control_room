"use client";

import { useEffect, useState } from "react";

import { VoiceLock } from "@/components/auth/VoiceLock";
import { Dashboard } from "@/components/Dashboard";

const KEY = "hermes:unlocked";

/**
 * Voice login gate. While locked, the Dashboard (and all its sockets, polling
 * and sound) is NOT mounted — only the lock's microphone listens. Unlock
 * persists for the browser-tab session; closing the tab re-locks.
 */
export function Gate() {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(KEY) === "1");
    setReady(true);
  }, []);

  // Don't flash the lock before we've read sessionStorage.
  if (!ready) return null;

  if (!unlocked) {
    return (
      <VoiceLock
        onUnlock={() => {
          sessionStorage.setItem(KEY, "1");
          setUnlocked(true);
        }}
      />
    );
  }

  return <Dashboard />;
}
