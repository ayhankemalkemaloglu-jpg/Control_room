import { create } from "zustand";

import { sortNewsNewestFirst } from "@/lib/news";
import type {
  Briefing,
  ChartTarget,
  ConnectionStatus,
  CountryEvent,
  Health,
  LayerId,
  LivePnlPosition,
  NewsItem,
  PnlUpdatePayload,
  PriceUpdatePayload,
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
  /** Latest /health snapshot for the status LEDs; null = backend unreachable. */
  health: Health | null;
  /** Live unrealized P&L per open trade id (from pnl:update). */
  livePnl: Record<number, LivePnlPosition>;
  /** Net unrealized P&L % across open positions; null until the first tick. */
  liveTotalPnlPct: number | null;
  /** Latest spot price per symbol (from price:update). */
  livePrices: Record<string, number>;
  /** Symbol the chart modal is showing; null = modal closed. */
  chartTarget: ChartTarget | null;
  /** News headlines pinned to the countries they mention (globe popups). */
  countryEvents: CountryEvent[];
  /** Latest news items (newest first) — shared by the feed tab and 𝕏 layer. */
  news: NewsItem[];
  voiceTranscript: string;
  /** ISO_A2 -> timestamp (ms) of the most recent activation. */
  activeCountries: Map<string, number>;
  /** Manually spotlighted country (ISO). Persists until changed/cleared. */
  highlightedCountry: string | null;
  /** Mute the new-news / trade chimes (persisted to localStorage). */
  soundMuted: boolean;

  setConnection: (status: ConnectionStatus) => void;
  setActiveLayer: (layer: LayerId) => void;
  pushBriefing: (briefing: Briefing) => void;
  /** Prepend a freshly opened position (from `trade:open`). */
  addOpenPosition: (trade: Trade) => void;
  /** Move a position out of `openPositions` into `closedTrades` by hash. */
  closePosition: (trade: Trade) => void;
  setStats: (stats: Stats) => void;
  /** Update the /health snapshot (null when the probe fails). */
  setHealth: (health: Health | null) => void;
  /** Replace live unrealized P&L wholesale from a pnl:update tick. */
  applyPnlUpdate: (payload: PnlUpdatePayload) => void;
  /** Record a symbol's latest spot price from a price:update tick. */
  applyPriceUpdate: (payload: PriceUpdatePayload) => void;
  /** Open the chart modal for a symbol (optionally with position context). */
  openChart: (target: ChartTarget) => void;
  /** Close the chart modal. */
  closeChart: () => void;
  /** Replace the set of news-driven country events on the globe. */
  setCountryEvents: (events: CountryEvent[]) => void;
  /** Replace the shared news list. */
  setNews: (news: NewsItem[]) => void;
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
  /** Set + persist the sound mute flag. */
  setSoundMuted: (muted: boolean) => void;
}

export const useHermesStore = create<HermesStore>((set, get) => ({
  connection: "connecting",
  activeLayer: "world",
  latestBriefing: null,
  briefings: [],
  openPositions: [],
  closedTrades: [],
  stats: null,
  health: null,
  livePnl: {},
  liveTotalPnlPct: null,
  livePrices: {},
  chartTarget: null,
  countryEvents: [],
  news: [],
  voiceTranscript: "",
  activeCountries: new Map<string, number>(),
  highlightedCountry: null,
  soundMuted: false,

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
  setHealth: (health) => set({ health }),

  applyPnlUpdate: (payload) =>
    set(() => {
      const byId: Record<number, LivePnlPosition> = {};
      for (const p of payload.positions) byId[p.trade_id] = p;
      return { livePnl: byId, liveTotalPnlPct: payload.total_pnl_pct };
    }),

  applyPriceUpdate: (payload) =>
    set((state) => ({
      livePrices: { ...state.livePrices, [payload.symbol]: payload.price },
    })),

  openChart: (target) => set({ chartTarget: target }),
  closeChart: () => set({ chartTarget: null }),
  setCountryEvents: (events) => set({ countryEvents: events }),
  setNews: (news) => set({ news: sortNewsNewestFirst(news) }),

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

  setSoundMuted: (muted) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("hermes:soundMuted", muted ? "1" : "0");
    }
    set({ soundMuted: muted });
  },
}));
