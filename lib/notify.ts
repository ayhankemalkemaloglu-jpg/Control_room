"use client";

import type { NewsItem } from "@/types/hermes";

/** Ask once for OS notification permission (no-op if unsupported / decided). */
export function ensureNotificationPermission(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission().catch(() => {});
  }
}

/**
 * Fire a single OS notification for a fresh headline (the newest, with a +N
 * suffix when several arrived together). Clicking opens the article. Silent
 * no-op unless permission was granted.
 */
export function notifyNews(newest: NewsItem, extraCount = 0): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const suffix = extraCount > 0 ? ` (+${extraCount})` : "";
  try {
    const n = new Notification(`Hermes • ${newest.source}${suffix}`, {
      body: newest.title,
      icon: newest.thumbnail ?? undefined,
      tag: newest.url, // collapse duplicate notifications for the same article
    });
    n.onclick = () => {
      window.open(newest.url, "_blank", "noopener,noreferrer");
      n.close();
    };
  } catch {
    /* Notification construction can throw on some platforms — ignore */
  }
}
