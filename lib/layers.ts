import type { LayerId } from "@/types/hermes";

/** Static globe layer metadata for the layer switcher. */
export interface LayerMeta {
  id: LayerId;
  /** Emoji used purely as iconography on the layer control. */
  emoji: string;
  label: string;
  caption: string;
}

export const LAYERS: LayerMeta[] = [
  { id: "world", emoji: "🌍", label: "Dünya", caption: "Küresel piyasalar" },
  { id: "turkey", emoji: "🇹🇷", label: "Türkiye", caption: "BIST & yerel akış" },
  { id: "news", emoji: "𝕏", label: "Haber", caption: "X / haber akışı" },
  { id: "agent", emoji: "🤖", label: "Hermes", caption: "Konuş / sesli komut" },
];
