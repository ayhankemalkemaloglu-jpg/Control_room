import type { LayerId } from "@/types/hermes";

/**
 * Static globe metadata (layers + markers). Trade/feed mock data was removed
 * once the panels switched to live backend state.
 */

export interface LayerMeta {
  id: LayerId;
  /** Emoji used purely as data/iconography on the layer control. */
  emoji: string;
  label: string;
  caption: string;
}

export const LAYERS: LayerMeta[] = [
  { id: "world", emoji: "🌍", label: "Dünya", caption: "Küresel piyasalar" },
  { id: "turkey", emoji: "🇹🇷", label: "Türkiye", caption: "BIST & yerel akış" },
  { id: "news", emoji: "𝕏", label: "Haber", caption: "X / haber akışı" },
];

export interface GlobeMarker {
  location: [number, number];
  size: number;
}

export const GLOBE_MARKERS: Record<LayerId, GlobeMarker[]> = {
  world: [
    { location: [40.7128, -74.006], size: 0.06 }, // New York
    { location: [51.5074, -0.1278], size: 0.05 }, // London
    { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
    { location: [1.3521, 103.8198], size: 0.04 }, // Singapore
    { location: [25.2048, 55.2708], size: 0.04 }, // Dubai
    { location: [41.0082, 28.9784], size: 0.05 }, // Istanbul
    { location: [22.3193, 114.1694], size: 0.04 }, // Hong Kong
  ],
  turkey: [
    { location: [41.0082, 28.9784], size: 0.08 }, // Istanbul
    { location: [39.9334, 32.8597], size: 0.05 }, // Ankara
    { location: [38.4237, 27.1428], size: 0.04 }, // Izmir
  ],
  news: [
    { location: [37.7749, -122.4194], size: 0.06 }, // San Francisco
    { location: [40.7128, -74.006], size: 0.05 }, // New York
    { location: [51.5074, -0.1278], size: 0.05 }, // London
    { location: [41.0082, 28.9784], size: 0.05 }, // Istanbul
  ],
};

/** Champagne-gold marker colour for cobe, normalised RGB (#c9a961). */
export const GOLD_RGB: [number, number, number] = [0.788, 0.663, 0.38];
