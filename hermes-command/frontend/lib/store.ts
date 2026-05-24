import { create } from "zustand";

import type {
  ConnectionStatus,
  HourlyBriefing,
  LayerId,
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
  latestBriefing: HourlyBriefing | null;
  briefings: HourlyBriefing[];
  voiceTranscript: string;
  /** ISO_A2 -> timestamp (ms) of the most recent activation. */
  activeCountries: Map<string, number>;

  setConnection: (status: ConnectionStatus) => void;
  setActiveLayer: (layer: LayerId) => void;
  pushBriefing: (briefing: HourlyBriefing) => void;
  setVoiceTranscript: (text: string) => void;
  /** Light up a country on the globe; auto-clears after ACTIVE_TTL_MS. */
  triggerCountry: (iso: string) => void;
  removeCountry: (iso: string) => void;
}

export const useHermesStore = create<HermesStore>((set, get) => ({
  connection: "connecting",
  activeLayer: "world",
  latestBriefing: null,
  briefings: [],
  voiceTranscript: "",
  activeCountries: new Map<string, number>(),

  setConnection: (status) => set({ connection: status }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  pushBriefing: (briefing) =>
    set((state) => ({
      latestBriefing: briefing,
      briefings: [briefing, ...state.briefings].slice(0, MAX_BRIEFINGS),
    })),
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
}));
