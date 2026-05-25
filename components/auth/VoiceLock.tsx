"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Match the spoken passphrase tolerantly: strip everything but Turkish letters,
 * require a greeting ("naber" / "ne haber" → "haber") plus a "cano"-ish token
 * (covers mis-hearings like "can o", "kano", "jano"). This is a soft UX lock,
 * NOT real authentication — the phrase ships in the bundle and the gate is
 * client-side.
 */
function isPassphrase(text: string): boolean {
  const n = text.toLocaleLowerCase("tr-TR").replace(/[^a-zçğıöşü]/g, "");
  const greeting = n.includes("naber") || n.includes("haber");
  const name = ["cano", "kano", "jano", "cono", "canoo"].some((v) => n.includes(v));
  return greeting && name;
}

export function VoiceLock({ onUnlock }: { onUnlock: () => void }) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognition | null>(null);
  const doneRef = useRef(false); // already unlocked — stop everything
  const keepRef = useRef(true); // keep auto-restarting recognition until unlocked

  const unlock = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    keepRef.current = false;
    recRef.current?.abort();
    onUnlock();
  }, [onUnlock]);

  useEffect(() => {
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      return;
    }

    const rec = new Recognition();
    rec.lang = "tr-TR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    rec.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        for (let j = 0; j < result.length; j += 1) {
          text += `${result[j].transcript} `;
        }
      }
      const t = text.trim();
      setTranscript(t.slice(-80));
      if (t) setHint(null);
      if (isPassphrase(t)) unlock();
    };
    rec.onend = () => {
      setListening(false);
      if (keepRef.current && !doneRef.current) {
        try {
          rec.start();
          setListening(true);
        } catch {
          /* already (re)starting — ignore */
        }
      }
    };
    rec.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        keepRef.current = false;
        setError("Mikrofon izni gerekli — izin verip tekrar deneyin.");
      }
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      /* ignore */
    }

    // Every 5s: reset the listening window (drop accumulated partials) and
    // prompt the user to try again. onend auto-restarts a fresh session.
    const resetTimer = window.setInterval(() => {
      if (doneRef.current) return;
      setTranscript("");
      setHint("Tekrar deneyin");
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }, 5000);

    return () => {
      keepRef.current = false;
      window.clearInterval(resetTimer);
      rec.onresult = null;
      rec.onend = null;
      rec.onerror = null;
      rec.abort();
      recRef.current = null;
    };
  }, [unlock]);

  const retry = () => {
    keepRef.current = true;
    setError(null);
    try {
      recRef.current?.start();
      setListening(true);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-6">
      <div className="glass flex w-full max-w-sm flex-col items-center gap-6 rounded-[16px] border border-border p-10 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Hermes
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Sesli Giriş
          </span>
        </div>

        <div
          className={cn(
            "relative flex size-20 items-center justify-center rounded-full border transition-colors",
            listening
              ? "border-gold/50 text-gold"
              : "border-border text-muted-foreground",
          )}
        >
          {listening && (
            <span className="live-dot absolute inset-0 rounded-full border border-gold/30" />
          )}
          {supported ? <Mic className="size-7" /> : <MicOff className="size-7" />}
        </div>

        <p className="text-sm text-muted-foreground">
          {!supported
            ? "Tarayıcınız sesli girişi desteklemiyor"
            : hint
              ? hint
              : listening
                ? "Dinliyorum — şifreyi söyleyin"
                : "Mikrofonu başlatıp şifreyi söyleyin"}
        </p>

        {transcript && (
          <p className="max-w-full truncate text-xs italic text-muted-foreground/70">
            “{transcript}”
          </p>
        )}
        {error && <p className="text-xs text-bearish">{error}</p>}

        {supported && !listening && (
          <button
            type="button"
            onClick={retry}
            className="rounded-md border border-gold/40 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
          >
            Dinlemeye başla
          </button>
        )}
      </div>
    </div>
  );
}
