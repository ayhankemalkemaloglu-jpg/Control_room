import type { CountryGeo } from "@/types/hermes";

// Keyword (lowercase) → country centroid. First match wins; ordered so more
// specific / crypto-relevant mentions win. Used to place a news headline on the
// globe over the country it mentions.
const RULES: { kw: string[]; geo: CountryGeo }[] = [
  { kw: ["türkiye", "turkey", "turkish", "istanbul", "bist", " lira"], geo: { iso: "TR", lat: 39, lng: 35 } },
  {
    kw: [
      "united states", "u.s.", "u.s ", " sec ", "s.e.c", "federal reserve",
      " fed ", "white house", "trump", "america", "american", "nasdaq",
      "wall street", "coinbase",
    ],
    geo: { iso: "US", lat: 38, lng: -97 },
  },
  { kw: ["china", "chinese", "beijing", "yuan"], geo: { iso: "CN", lat: 35, lng: 105 } },
  { kw: ["japan", "japanese", "tokyo", " yen"], geo: { iso: "JP", lat: 36, lng: 138 } },
  { kw: ["south korea", "korean", "seoul", "upbit"], geo: { iso: "KR", lat: 37, lng: 127 } },
  { kw: ["india", "indian", "mumbai", "rupee"], geo: { iso: "IN", lat: 21, lng: 78 } },
  { kw: ["russia", "russian", "moscow", "ruble"], geo: { iso: "RU", lat: 61, lng: 105 } },
  { kw: ["united kingdom", "u.k.", "britain", "british", "london"], geo: { iso: "GB", lat: 54, lng: -2 } },
  { kw: ["germany", "german", "berlin"], geo: { iso: "DE", lat: 51, lng: 10 } },
  { kw: ["france", "french", "paris"], geo: { iso: "FR", lat: 46, lng: 2 } },
  { kw: ["el salvador", "bukele"], geo: { iso: "SV", lat: 13.8, lng: -88.9 } },
  { kw: ["dubai", "u.a.e", " uae", "emirates", "abu dhabi"], geo: { iso: "AE", lat: 24, lng: 54 } },
  { kw: ["singapore"], geo: { iso: "SG", lat: 1.35, lng: 103.8 } },
  { kw: ["hong kong"], geo: { iso: "HK", lat: 22.3, lng: 114.2 } },
  { kw: ["brazil", "brazilian"], geo: { iso: "BR", lat: -10, lng: -55 } },
  { kw: ["canada", "canadian"], geo: { iso: "CA", lat: 56, lng: -106 } },
  { kw: ["australia", "australian"], geo: { iso: "AU", lat: -25, lng: 133 } },
  { kw: ["nigeria", "nigerian"], geo: { iso: "NG", lat: 9, lng: 8 } },
  { kw: ["argentina", "argentine", "milei"], geo: { iso: "AR", lat: -38, lng: -63 } },
];

/** Find the first country a headline mentions, or null. */
export function matchCountry(text: string): CountryGeo | null {
  const t = ` ${text.toLowerCase()} `;
  for (const r of RULES) {
    if (r.kw.some((k) => t.includes(k))) return r.geo;
  }
  return null;
}
