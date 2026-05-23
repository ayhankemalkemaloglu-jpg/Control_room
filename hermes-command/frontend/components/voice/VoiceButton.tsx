"use client";

import { Mic, MicOff } from "lucide-react";

import { useVoiceCommand } from "@/hooks/useVoiceCommand";
import { cn } from "@/lib/utils";

export function VoiceButton() {
  const { supported, listening, transcript, toggle } = useVoiceCommand();

  return (
    <div className="flex items-center gap-3">
      {listening && transcript && (
        <span className="max-w-[220px] truncate text-xs italic text-muted-foreground">
          {transcript}
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={!supported}
        aria-label="Sesli komut"
        title={
          supported
            ? "Sesli komut (tr-TR)"
            : "Tarayıcı sesli komutu desteklemiyor"
        }
        className={cn(
          "relative flex size-9 items-center justify-center rounded-md border transition-colors duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-40",
          listening
            ? "border-gold/40 text-gold"
            : "border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        )}
      >
        {listening && (
          <span className="live-dot absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-gold" />
        )}
        {supported ? <Mic className="size-4" /> : <MicOff className="size-4" />}
      </button>
    </div>
  );
}
