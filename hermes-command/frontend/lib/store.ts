import { create } from "zustand";

import type {
  Briefing,
  ConnectionStatus,
  LayerId,
  Stats,
  Trade,
} from "@/types/hermes";

/** How many recent briefings the left-panel feed keeps in view. */
const MAX_BRIEFINGS = 6;

/** How long a country stays "active" (raised + highlighted) on the globe. */
const ACTIVE_TTL_MS = 2000;

/** Per-country expiry timers, so re-triggering a country resets its TTL. */
const countryTimers = new Map<string, ReturnType<typeof setTimeout>>();

interface HermesStore {
  connection: ConnectionStatus;
  activeLayer: LayerId;
  latestBriefing: Briefing | null;
  briefings: Briefing[];
  /** Currently open trades — newest first (right panel). */
  openPositions: Trade[];
  /** Closed trade history — newest first. */
  closedTrades: Trade[];
  /** Aggregate trade stats for the bottom bar; null until hydrated. */
  stats: Stats | null;
  voiceTranscript: string;
  /** ISO_A2 -> timestamp (ms) of the most recent activation. */
  activeCountries: Map<string, number>;
  /** Manually spotlighted country (ISO). Persists until changed/cleared. */
  highlightedCountry: string | null;

  setConnection: (status: ConnectionStatus) => void;
  setActiveLayer: (layer: LayerId) => void;
  pushBriefing: (briefing: Briefing) => void;
  /** Prepend a freshly opened position (from `trade:open`). */
  addOpenPosition: (trade: Trade) => void;
  /** Move a position out of `openPositions` into `closedTrades` by hash. */
  closePosition: (trade: Trade) => void;
  setStats: (stats: Stats) => void;
  /** Replace open positions wholesale (REST hydration). */
  setOpenPositions: (positions: Trade[]) => void;
  /** Replace closed trades wholesale (REST hydration). */
  setClosedTrades: (trades: Trade[]) => void;
  setVoiceTranscript: (text: string) => void;
  /** Light up a country on the globe; auto-clears after ACTIVE_TTL_MS. */
  triggerCountry: (iso: string) => void;
  removeCountry: (iso: string) => void;
  /** Spotlight a country (or clear with null). Does not auto-expire. */
  setHighlight: (iso: string | null) => void;
}

export const useHermesStore = create<HermesStore>((set, get) => ({
  connection: "connecting",
  activeLayer: "world",
  latestBriefing: null,
  briefings: [],
  openPositions: [],
  closedTrades: [],
  stats: null,
  voiceTranscript: "",
  activeCountries: new Map<string, number>(),
  highlightedCountry: null,

  setConnection: (status) => set({ connection: status }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  pushBriefing: (briefing) =>
    set((state) => ({
      latestBriefing: briefing,
      briefings: [briefing, ...state.briefings].slice(0, MAX_BRIEFINGS),
    })),

  addOpenPosition: (trade) =>
    set((state) => ({ openPositions: [trade, ...state.openPositions] })),

  closePosition: (trade) =>
    set((state) => ({
      openPositions: state.openPositions.filter(
        (p) => p.position_hash !== trade.position_hash,
      ),
      closedTrades: [trade, ...state.closedTrades],
    })),

  setStats: (stats) => set({ stats }),
  setOpenPositions: (positions) => set({ openPositions: positions }),
  setClosedTrades: (trades) => set({ closedTrades: trades }),

  setVoiceTranscript: (text) => set({ voiceTranscript: text }),

  triggerCountry: (iso) => {
    const code = iso.toUpperCase();
    const next = new Map(get().activeCountries);
    next.set(code, Date.now());
    set({ activeCountries: next });

    const existing = countryTimers.get(code);
    if (existing) clearTimeout(existing);
    countryTimers.set(
      code,
      setTimeout(() => {
        countryTimers.delete(code);
        get().removeCountry(code);
      }, ACTIVE_TTL_MS),
    );
  },

  removeCountry: (iso) => {
    const code = iso.toUpperCase();
    const current = get().activeCountries;
    if (!current.has(code)) return;
    const next = new Map(current);
    next.delete(code);
    set({ activeCountries: next });
  },

  setHighlight: (iso) =>
    set({ highlightedCountry: iso ? iso.toUpperCase() : null }),
}));
