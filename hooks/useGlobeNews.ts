"use client";

import { useEffect } from "react";

import { fetchNews } from "@/lib/api";
import { matchCountry } from "@/lib/countries";
import { sortNewsNewestFirst } from "@/lib/news";
import { ensureNotificationPermission, notifyNews } from "@/lib/notify";
import { useHermesStore } from "@/lib/store";
import type { CountryEvent } from "@/types/hermes";

const REFRESH_MS = 30_000;
const MAX_EVENTS = 8;
const MAX_PER_COUNTRY = 3;

// URLs already handled (popped / notified), kept for the whole session so a
// headline is never re-shown or re-notified — survives the globe layer
// unmounting/remounting on tab switches.
const handled = new Set<string>();
// First load seeds `handled` WITHOUT firing OS notifications (no backlog spam).
let primed = false;

/**
 * Pull crypto news periodically, publish it newest-first (feed tab + globe),
 * map each headline to the country it mentions for the globe popups, and fire
 * an OS notification for genuinely-new headlines only.
 */
export function useGlobeNews(): void {
  const setCountryEvents = useHermesStore((s) => s.setCountryEvents);
  const setNews = useHermesStore((s) => s.setNews);

  useEffect(() => {
    let cancelled = false;
    ensureNotificationPermission();

    const load = async () => {
      try {
        const items = sortNewsNewestFirst(await fetchNews("crypto", 30));
        if (cancelled) return;
        setNews(items);

        // Newest-first popups, one per headline, capped per country so a single
        // dominant country (e.g. US) can't fill the globe.
        const perCountry = new Map<string, number>();
        const events: CountryEvent[] = [];
        for (const n of items) {
          if (events.length >= MAX_EVENTS) break;
          const geo = matchCountry(`${n.title} ${n.description ?? ""}`);
          if (!geo) continue;
          const count = perCountry.get(geo.iso) ?? 0;
          if (count >= MAX_PER_COUNTRY) continue;
          perCountry.set(geo.iso, count + 1);
          events.push({
            ...geo,
            headline: n.title,
            url: n.url,
            at: n.age ?? "",
            thumbnail: n.thumbnail,
          });
        }
        setCountryEvents(events);

        // Notify once for newly-arrived headlines (skip the initial backlog).
        const fresh = items.filter((n) => !handled.has(n.url));
        if (primed && fresh.length > 0) {
          notifyNews(fresh[0], fresh.length - 1);
        }
        for (const n of items) handled.add(n.url);
        primed = true;
      } catch {
        /* transient — keep the previous events */
      }
    };

    void load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [setCountryEvents, setNews]);
}
