"use client";

import { HermesFeed } from "@/components/feed/HermesFeed";
import { PuzzleGlobe } from "@/components/globe/PuzzleGlobe";
import { LayerSwitcher } from "@/components/globe/LayerSwitcher";
import { BottomBar } from "@/components/layout/BottomBar";
import { TopBar } from "@/components/layout/TopBar";
import { PositionsPanel } from "@/components/positions/PositionsPanel";
import { useHermesSocket } from "@/hooks/useHermesSocket";

export function Dashboard() {
  useHermesSocket();

  return (
    <div className="flex h-screen min-w-[1440px] flex-col bg-background text-foreground">
      <TopBar />

      <main className="grid min-h-0 flex-1 grid-cols-[320px_1fr_320px] gap-4 p-4">
        <HermesFeed />

        <section className="relative flex min-h-0 flex-col">
          <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2">
            <LayerSwitcher />
          </div>
          <PuzzleGlobe />
        </section>

        <PositionsPanel />
      </main>

      <BottomBar />
    </div>
  );
}
