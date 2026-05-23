"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

import { LiveDot } from "@/components/common/LiveDot";
import { GLOBE_MARKERS, GOLD_RGB, LAYERS } from "@/lib/mock";
import { useHermesStore } from "@/lib/store";

export function GlobeView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phiRef = useRef(0);
  const activeLayer = useHermesStore((s) => s.activeLayer);
  const layerMeta = LAYERS.find((l) => l.id === activeLayer) ?? LAYERS[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = canvas.offsetWidth;
    const observer = new ResizeObserver(() => {
      width = canvas.offsetWidth;
    });
    observer.observe(canvas);

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: phiRef.current,
      theta: 0.22,
      dark: 1,
      diffuse: 1.0,
      mapSamples: 18000,
      mapBrightness: 4.2,
      baseColor: [0.14, 0.14, 0.16],
      markerColor: GOLD_RGB,
      glowColor: [0.05, 0.05, 0.06],
      markers: GLOBE_MARKERS[activeLayer],
    });

    // cobe v2 drives animation via update() — advance phi each frame for a
    // slow, deliberate rotation.
    let frame = requestAnimationFrame(function tick() {
      phiRef.current += 0.0022;
      globe.update({ phi: phiRef.current, width: width * 2, height: width * 2 });
      frame = requestAnimationFrame(tick);
    });

    const reveal = window.setTimeout(() => {
      canvas.style.opacity = "1";
    }, 80);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(reveal);
      observer.disconnect();
      globe.destroy();
    };
  }, [activeLayer]);

  return (
    <div className="relative flex size-full flex-col items-center justify-center">
      <div className="absolute right-1 top-1">
        <LiveDot />
      </div>

      <div className="relative aspect-square w-full max-w-[520px]">
        {/* Pure-black core with a soft champagne glow ring (shadow, not gradient). */}
        <div className="globe-glow absolute inset-[6%] rounded-full bg-black" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full opacity-0 transition-opacity duration-700 ease-out"
        />
      </div>

      <div className="mt-8 flex flex-col items-center gap-1 text-center">
        <span className="font-display text-base text-foreground">
          {layerMeta.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {layerMeta.caption}
        </span>
      </div>
    </div>
  );
}
