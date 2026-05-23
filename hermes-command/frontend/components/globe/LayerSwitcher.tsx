"use client";

import { motion } from "framer-motion";

import { LAYERS } from "@/lib/mock";
import { useHermesStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function LayerSwitcher() {
  const activeLayer = useHermesStore((s) => s.activeLayer);
  const setActiveLayer = useHermesStore((s) => s.setActiveLayer);

  return (
    <div className="glass flex items-center gap-1 rounded-[12px] border border-border p-1">
      {LAYERS.map((layer) => {
        const active = layer.id === activeLayer;
        return (
          <button
            key={layer.id}
            type="button"
            onClick={() => setActiveLayer(layer.id)}
            className={cn(
              "relative flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm transition-colors duration-300 ease-out",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="layer-active"
                className="absolute inset-0 rounded-md border border-border bg-secondary"
                transition={{ duration: 0.45, ease: EASE }}
              />
            )}
            <span className="relative z-10 text-base leading-none" aria-hidden>
              {layer.emoji}
            </span>
            <span className="relative z-10 font-medium">{layer.label}</span>
          </button>
        );
      })}
    </div>
  );
}
