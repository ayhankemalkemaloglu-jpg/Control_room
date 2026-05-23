import { create } from "zustand";

import type {
  ConnectionStatus,
  HourlyBriefing,
  LayerId,
} from "@/types/hermes";

/** How many recent briefings the left-panel feed keeps in view. */
const MAX_BRIEFINGS = 6;

interface HermesStore {
  connection: ConnectionStatus;
  activeLayer: LayerId;
  latestBriefing: HourlyBriefing | null;
  briefings: HourlyBriefing[];
  voiceTranscript: string;

  setConnection: (status: ConnectionStatus) => void;
  setActiveLayer: (layer: LayerId) => void;
  pushBriefing: (briefing: HourlyBriefing) => void;
  setVoiceTranscript: (text: string) => void;
}

export const useHermesStore = create<HermesStore>((set) => ({
  connection: "connecting",
  activeLayer: "world",
  latestBriefing: null,
  briefings: [],
  voiceTranscript: "",

  setConnection: (status) => set({ connection: status }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  pushBriefing: (briefing) =>
    set((state) => ({
      latestBriefing: briefing,
      briefings: [briefing, ...state.briefings].slice(0, MAX_BRIEFINGS),
    })),
  setVoiceTranscript: (text) => set({ voiceTranscript: text }),
}));
