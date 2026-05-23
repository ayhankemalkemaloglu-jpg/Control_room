import type { HermesMessage, LayerId, Position } from "@/types/hermes";

/**
 * Phase 1 mock data. Timestamps are fixed (never `Date.now()`) so server and
 * client render identically — no hydration drift.
 */

export const MOCK_FEED: HermesMessage[] = [
  {
    id: "feed-1",
    timestamp: "2026-05-23T13:48:00Z",
    level: "signal",
    title: "BTC likidite haritası güncellendi",
    body: "Üst banda 72.4K, alt banda 69.8K likidite kümelendi. 🟢 Alım baskısı 71.2K üstünde yoğunlaşıyor.",
    symbol: "BTC",
  },
  {
    id: "feed-2",
    timestamp: "2026-05-23T13:35:00Z",
    level: "alert",
    title: "ETH funding negatife döndü",
    body: "8 saatlik funding −0.011%. 🔴 Short tarafı kalabalıklaşıyor, sıkışma riski artıyor.",
    symbol: "ETH",
  },
  {
    id: "feed-3",
    timestamp: "2026-05-23T13:12:00Z",
    level: "success",
    title: "SOL pozisyonu kapatıldı",
    body: "Hedef 1 teslim alındı. 🟢 Realize PnL +$1,284 (+%3.2). Kalan pozisyon trailing stop'a taşındı.",
    symbol: "SOL",
  },
  {
    id: "feed-4",
    timestamp: "2026-05-23T12:30:00Z",
    level: "info",
    title: "Makro takvim",
    body: "16:30 ABD Çekirdek PCE. Volatilite beklentisi yüksek, kademeli pozisyon önerilir. 📅",
  },
  {
    id: "feed-5",
    timestamp: "2026-05-23T11:55:00Z",
    level: "warning",
    title: "Düşük hacim uyarısı",
    body: "THYAO seans içi hacim 20G ortalamasının %62'sinde. ⚠️ Geniş spread, dikkatli giriş.",
    symbol: "THYAO",
  },
];

export const MOCK_POSITIONS: Position[] = [
  {
    id: "pos-1",
    symbol: "BTC",
    name: "Bitcoin",
    market: "crypto",
    side: "long",
    entryPrice: 69820,
    markPrice: 71250,
    size: 42000,
    leverage: 5,
    pnl: 4302,
    pnlPct: 10.24,
    openedAt: "2026-05-23T09:14:00Z",
  },
  {
    id: "pos-2",
    symbol: "ETH",
    name: "Ethereum",
    market: "crypto",
    side: "short",
    entryPrice: 3910,
    markPrice: 3820,
    size: 18500,
    leverage: 3,
    pnl: 426,
    pnlPct: 2.3,
    openedAt: "2026-05-23T10:02:00Z",
  },
  {
    id: "pos-3",
    symbol: "THYAO",
    name: "Türk Hava Yolları",
    market: "stock",
    side: "long",
    entryPrice: 318.4,
    markPrice: 312.1,
    size: 26000,
    leverage: 1,
    pnl: -514,
    pnlPct: -1.98,
    openedAt: "2026-05-22T14:40:00Z",
  },
];

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
