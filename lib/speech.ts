"use client";

function pickTurkishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith("tr")) ?? undefined
  );
}

/** Speak text with the browser's built-in TTS (free). Turkish by default. */
export function speak(text: string, onend?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onend?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel(); // stop anything currently speaking
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "tr-TR";
  const v = pickTurkishVoice();
  if (v) u.voice = v;
  u.rate = 1.05;
  if (onend) {
    u.onend = () => onend();
    u.onerror = () => onend();
  }
  synth.speak(u);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
