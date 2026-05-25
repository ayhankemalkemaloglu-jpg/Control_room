"use client";

import { useHermesStore } from "@/lib/store";

export type Chime = "news" | "open" | "close";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

/** Resume the audio context — browsers gate it behind a user gesture. */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}

// Unlock on the very first user interaction so later chimes can sound.
if (typeof window !== "undefined") {
  const onFirstGesture = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", onFirstGesture);
    window.removeEventListener("keydown", onFirstGesture);
  };
  window.addEventListener("pointerdown", onFirstGesture);
  window.addEventListener("keydown", onFirstGesture);
}

function tone(c: AudioContext, freq: number, start: number, dur: number, peak = 0.06): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  // Quick fade in/out (exponential ramps avoid clicks).
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

// Short, distinct motifs: news = soft ping, open = rising, close = falling.
const PATTERNS: Record<Chime, number[]> = {
  news: [880],
  open: [660, 990],
  close: [880, 587],
};

/** Play a short synthesized chime, unless sound is muted. No-op server-side. */
export function playChime(kind: Chime): void {
  if (useHermesStore.getState().soundMuted) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume().catch(() => {});
  const now = c.currentTime;
  PATTERNS[kind].forEach((f, i) => tone(c, f, now + i * 0.14, 0.16));
}
