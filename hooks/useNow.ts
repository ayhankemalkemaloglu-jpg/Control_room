"use client";

import { useEffect, useState } from "react";

/**
 * Ticking clock. Returns `null` until mounted so server and client markup
 * match on first paint, then updates every `intervalMs`.
 */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
