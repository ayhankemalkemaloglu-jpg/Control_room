"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";
import type { GlobeMethods } from "react-globe.gl";

import { LiveDot } from "@/components/common/LiveDot";
import { useHermesStore } from "@/lib/store";
import type { CountryEvent } from "@/types/hermes";

/**
 * Altitudes (puzzle-piece extrusion heights). Bases stay on the globe
 * surface; only the cap height changes, so pieces extrude straight up
 * without drifting in X/Z. Priority: highlight > active > pinned > hover.
 */
const ALT_DEFAULT = 0.025;
const ALT_HOVER = 0.07;
const ALT_PINNED = 0.1;
const ALT_ACTIVE = 0.16; // news/event
const ALT_HIGHLIGHT = 0.18; // manual spotlight (tallest)

/** Cap colors — solid, no gradients. */
const CAP_DEFAULT = "#c9a961b3"; // champagne gold, ~70% opacity
const CAP_ACTIVE = "#f0d896"; // bright gold (news)
const CAP_HIGHLIGHT = "#f5e0a8"; // brightest, shimmering gold (spotlight)

/** Side-wall colors — give the "thick puzzle piece" depth. */
const SIDE_DEFAULT = "#3a2e1a"; // dark matte champagne-brown
const SIDE_HIGHLIGHT = "#8a7340"; // lifted gold wall when spotlighted

/** Pure-black borders → crisp puzzle-piece contours / gaps. */
const STROKE_COLOR = "#000000";
const ATMOSPHERE_COLOR = "#c9a961";

const GEOJSON_URL = "/data/countries.geojson";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** How long each news country stays raised (with its popup) before the next. */
const DWELL_MS = 5000;
/** Blank gap between popups — the country lowers, then the next rises. */
const GAP_MS = 1500;

type GlobeComponent = (typeof import("react-globe.gl"))["default"];

interface CountryFeature {
  properties: {
    ADMIN?: string;
    NAME?: string;
    NAME_LONG?: string;
    ISO_A2?: string;
    ISO_A2_EH?: string;
    ISO_A3?: string;
  };
}

/** Resolve a usable ISO code, working around Natural Earth's "-99" gaps. */
function isoOf(feat: CountryFeature): string {
  const p = feat.properties;
  const a2 = p.ISO_A2 && p.ISO_A2 !== "-99" ? p.ISO_A2 : undefined;
  const a2eh = p.ISO_A2_EH && p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : undefined;
  return (a2 ?? a2eh ?? p.ISO_A3 ?? p.ADMIN ?? "??").toUpperCase();
}

function nameOf(feat: CountryFeature): string {
  const p = feat.properties;
  return (p.NAME_LONG ?? p.ADMIN ?? p.NAME ?? "").toUpperCase();
}

function PuzzleGlobeImpl() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const resumeTimer = useRef<number | null>(null);
  const introTimer = useRef<number | null>(null);

  const [GlobeComp, setGlobeComp] = useState<GlobeComponent | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [hovered, setHovered] = useState<CountryFeature | null>(null);
  const [pinned, setPinned] = useState<Set<string>>(() => new Set());

  const countryEvents = useHermesStore((s) => s.countryEvents);
  const highlightedCountry = useHermesStore((s) => s.highlightedCountry);
  const setHighlight = useHermesStore((s) => s.setHighlight);

  // Show each news event ONCE: the country rises with its popup for DWELL_MS,
  // then lowers/clears for GAP_MS, then the next *unseen* event. Once all are
  // shown the globe goes quiet until fresh news arrives (find the rest in the
  // Haber tab). `seen` persists across refetches so nothing repeats.
  const seenRef = useRef<Set<string>>(new Set());
  const [active, setActive] = useState<CountryEvent | null>(null);
  useEffect(() => {
    let cancelled = false;
    let timer: number;
    const step = () => {
      if (cancelled) return;
      const next = countryEvents.find((e) => !seenRef.current.has(e.url));
      if (!next) {
        setActive(null); // nothing new — wait for the next news refresh
        return;
      }
      seenRef.current.add(next.url);
      setActive(next);
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setActive(null); // country lowers, popup clears
        timer = window.setTimeout(step, GAP_MS);
      }, DWELL_MS);
    };
    step();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [countryEvents]);
  const activeIso = active?.iso ?? null;

  // Load react-globe.gl on the client only (WebGL — never on the server),
  // keeping a direct component reference so the ref forwards cleanly.
  useEffect(() => {
    let cancelled = false;
    void import("react-globe.gl").then((mod) => {
      if (!cancelled) setGlobeComp(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Track the container size and feed it to the globe.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Country polygons.
  useEffect(() => {
    let cancelled = false;
    void fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((geo: { features: CountryFeature[] }) => {
        if (!cancelled) setFeatures(geo.features);
      })
      .catch(() => {
        /* offline / missing file — globe simply renders no countries */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dark globe sphere (#0a0a0c) — visible as ocean; countries float above it.
  const globeMaterial = useMemo(
    () => new THREE.MeshPhongMaterial({ color: "#0a0a0c" }),
    [],
  );

  // Priority: highlight > active (news) > pinned > hover > default.
  const polygonAltitude = useCallback(
    (obj: object) => {
      const feat = obj as CountryFeature;
      const iso = isoOf(feat);
      if (highlightedCountry === iso) return ALT_HIGHLIGHT;
      if (activeIso === iso) return ALT_ACTIVE;
      if (pinned.has(iso)) return ALT_PINNED;
      if (hovered === feat) return ALT_HOVER;
      return ALT_DEFAULT;
    },
    [highlightedCountry, activeIso, pinned, hovered],
  );

  const polygonCapColor = useCallback(
    (obj: object) => {
      const iso = isoOf(obj as CountryFeature);
      if (highlightedCountry === iso) return CAP_HIGHLIGHT;
      if (activeIso === iso) return CAP_ACTIVE;
      return CAP_DEFAULT;
    },
    [highlightedCountry, activeIso],
  );

  // A small headline popup (with photo when available) above the country, with
  // a downward pointer whose tip marks the country itself.
  const buildPopup = useCallback((obj: object) => {
    const e = obj as CountryEvent;

    // Container anchored at the country; bottom (pointer tip) sits on the point.
    const el = document.createElement("div");
    el.style.cssText =
      "pointer-events:auto;cursor:pointer;transform:translate(-50%,-100%);" +
      "display:flex;flex-direction:column;align-items:center;width:150px;";

    const card = document.createElement("div");
    card.style.cssText =
      "width:100%;background:rgba(12,10,9,0.95);border:1px solid rgba(201,169,97,0.5);" +
      "border-radius:7px;overflow:hidden;color:#f5e0a8;" +
      "font:500 9px/1.3 ui-sans-serif,system-ui,sans-serif;" +
      "box-shadow:0 6px 18px rgba(0,0,0,0.6);backdrop-filter:blur(4px);";

    if (e.thumbnail) {
      const img = document.createElement("img");
      img.src = e.thumbnail;
      img.alt = "";
      img.style.cssText = "width:100%;height:56px;object-fit:cover;display:block;";
      img.onerror = () => img.remove();
      card.appendChild(img);
    }

    const body = document.createElement("div");
    body.style.cssText = "padding:5px 7px;";
    const title = document.createElement("div");
    title.textContent =
      e.headline.length > 64 ? `${e.headline.slice(0, 64)}…` : e.headline;
    body.appendChild(title);
    card.appendChild(body);
    el.appendChild(card);

    // Pointer triangle — its tip rests on the country.
    const tri = document.createElement("div");
    tri.style.cssText =
      "width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;" +
      "border-top:7px solid rgba(201,169,97,0.65);";
    el.appendChild(tri);

    el.title = e.headline;
    el.onclick = () => window.open(e.url, "_blank", "noopener,noreferrer");
    return el;
  }, []);

  const polygonSideColor = useCallback(
    (obj: object) =>
      highlightedCountry === isoOf(obj as CountryFeature)
        ? SIDE_HIGHLIGHT
        : SIDE_DEFAULT,
    [highlightedCountry],
  );

  const handleHover = useCallback((obj: object | null) => {
    const feat = (obj as CountryFeature | null) ?? null;
    setHovered(feat);

    const controls = globeRef.current?.controls();
    if (feat) {
      // Pause the slow auto-rotation while inspecting a country.
      if (resumeTimer.current !== null) {
        window.clearTimeout(resumeTimer.current);
        resumeTimer.current = null;
      }
      if (controls) controls.autoRotate = false;
    } else {
      // Resume 3s after the cursor leaves the countries.
      if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
      resumeTimer.current = window.setTimeout(() => {
        const c = globeRef.current?.controls();
        if (c) c.autoRotate = true;
        resumeTimer.current = null;
      }, 3000);
    }
  }, []);

  const handleClick = useCallback((obj: object) => {
    const feat = obj as CountryFeature;
    const iso = isoOf(feat);
    // Reserved for Phase 2 drill-down.
    console.log("[globe] country pinned:", iso, nameOf(feat));
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  }, []);

  const handleReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    // Turkey-centered opening shot.
    globe.pointOfView({ lat: 39, lng: 35, altitude: 2.2 }, 0);
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3; // slow, deliberate, luxurious
    controls.enableZoom = true;

    // First-load demo: spotlight Turkey for 3s so the highlight is visible.
    setHighlight("TR");
    introTimer.current = window.setTimeout(() => setHighlight(null), 3000);
  }, [setHighlight]);

  useEffect(
    () => () => {
      if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
      if (introTimer.current !== null) window.clearTimeout(introTimer.current);
    },
    [],
  );

  const ready = size.width > 0 && size.height > 0 && GlobeComp !== null;

  return (
    <div ref={containerRef} className="relative size-full">
      <div className="pointer-events-none absolute left-1 top-1 z-10 h-5">
        <AnimatePresence>
          {hovered && (
            <motion.span
              key={isoOf(hovered)}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="font-display text-sm uppercase text-gold"
              style={{ letterSpacing: "0.15em" }}
            >
              {nameOf(hovered)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute right-1 top-1 z-10">
        <LiveDot />
      </div>

      {ready && GlobeComp && (
        <GlobeComp
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={globeMaterial}
          showGraticules={false}
          showAtmosphere
          atmosphereColor={ATMOSPHERE_COLOR}
          atmosphereAltitude={0.12}
          polygonsData={features}
          polygonAltitude={polygonAltitude}
          polygonCapColor={polygonCapColor}
          polygonSideColor={polygonSideColor}
          polygonStrokeColor={STROKE_COLOR}
          polygonsTransitionDuration={600}
          onPolygonHover={handleHover}
          onPolygonClick={handleClick}
          onGlobeReady={handleReady}
          htmlElementsData={active ? [active] : []}
          htmlElement={buildPopup}
          htmlLat={(d: object) => (d as CountryEvent).lat}
          htmlLng={(d: object) => (d as CountryEvent).lng}
          htmlAltitude={0.22}
          ringsData={active ? [active] : []}
          ringLat={(d: object) => (d as CountryEvent).lat}
          ringLng={(d: object) => (d as CountryEvent).lng}
          ringColor={() => "#f0d896"}
          ringMaxRadius={4}
          ringPropagationSpeed={1.5}
          ringRepeatPeriod={900}
          ringAltitude={0.016}
        />
      )}
    </div>
  );
}

export const PuzzleGlobe = memo(PuzzleGlobeImpl);
export default PuzzleGlobe;
