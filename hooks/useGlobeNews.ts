"use client";

import { useEffect } from "react";

import { fetchNews } from "@/lib/api";
import { matchCountry } from "@/lib/countries";
import { useHermesStore } from "@/lib/store";
import type { CountryEvent } from "@/types/hermes";

const REFRESH_MS = 30_000;
const MAX_EVENTS = 6;

/**
 * Pull crypto news periodically, map each headline to the country it mentions,
 * and publish one event per country (newest headline wins) for the globe to
 * raise + label. Runs app-wide so the globe reacts on any layer.
 */
export function useGlobeNews(): void {
  const setCountryEvents = useHermesStore((s) => s.setCountryEvents);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const items = await fetchNews("crypto", 30);
        if (cancelled) return;
        const byIso = new Map<string, CountryEvent>();
        for (const n of items) {
          const geo = matchCountry(`${n.title} ${n.description ?? ""}`);
          if (!geo) continue;
          const candidate: CountryEvent = {
            ...geo,
            headline: n.title,
            url: n.url,
            at: n.age ?? "",
            thumbnail: n.thumbnail,
          };
          const existing = byIso.get(geo.iso);
          // Keep one event per country, but prefer one that has a photo.
          if (!existing) byIso.set(geo.iso, candidate);
          else if (!existing.thumbnail && n.thumbnail) byIso.set(geo.iso, candidate);
        }
        setCountryEvents([...byIso.values()].slice(0, MAX_EVENTS));
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
  }, [setCountryEvents]);
}
