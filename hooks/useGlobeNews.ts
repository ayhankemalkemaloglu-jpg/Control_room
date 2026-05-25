"use client";

import { useEffect } from "react";

import { fetchNews } from "@/lib/api";
import { matchCountry } from "@/lib/countries";
import { useHermesStore } from "@/lib/store";
import type { CountryEvent } from "@/types/hermes";

const REFRESH_MS = 30_000;
const MAX_EVENTS = 8;
const MAX_PER_COUNTRY = 3;

/**
 * Pull crypto news periodically, map each headline to the country it mentions,
 * and publish one event per country (newest headline wins) for the globe to
 * raise + label. Runs app-wide so the globe reacts on any layer.
 */
export function useGlobeNews(): void {
  const setCountryEvents = useHermesStore((s) => s.setCountryEvents);
  const setNews = useHermesStore((s) => s.setNews);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const items = await fetchNews("crypto", 30);
        if (cancelled) return;
        setNews(items);
        // Keep several distinct headlines (not one per country) so the globe
        // cycles through varied popups instead of repeating the same one — but
        // cap per country so a single dominant country (e.g. US) can't fill it.
        const perCountry = new Map<string, number>();
        const matched: CountryEvent[] = [];
        for (const n of items) {
          const geo = matchCountry(`${n.title} ${n.description ?? ""}`);
          if (!geo) continue;
          const count = perCountry.get(geo.iso) ?? 0;
          if (count >= MAX_PER_COUNTRY) continue;
          perCountry.set(geo.iso, count + 1);
          matched.push({
            ...geo,
            headline: n.title,
            url: n.url,
            at: n.age ?? "",
            thumbnail: n.thumbnail,
          });
        }

        // Round-robin by country so consecutive popups differ geographically.
        const groups = new Map<string, CountryEvent[]>();
        for (const e of matched) {
          const g = groups.get(e.iso);
          if (g) g.push(e);
          else groups.set(e.iso, [e]);
        }
        const events: CountryEvent[] = [];
        let added = true;
        while (added && events.length < MAX_EVENTS) {
          added = false;
          for (const list of groups.values()) {
            const e = list.shift();
            if (e && events.length < MAX_EVENTS) {
              events.push(e);
              added = true;
            }
          }
        }
        setCountryEvents(events);
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
