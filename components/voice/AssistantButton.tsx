"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";

import { askAssistant } from "@/lib/api";
import { speak, stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";

type State = "idle" | "listening" | "thinking" | "speaking";

const LABEL: Record<State, string> = {
  idle: "Sesli asistan",
  listening: "Dinliyorum…",
  thinking: "Düşünüyorum…",
  speaking: "Yanıtlıyorum…",
};

export function AssistantButton() {
  const [state, setState] = useState<State>("idle");
  const [supported, setSupported] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [open, setOpen] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSupported(
      !!(window.SpeechRecognition ?? window.webkitSpeechRecognition),
    );
  }, []);

  const ask = useCallback(async (text: string) => {
    setQuestion(text);
    setAnswer("");
    setOpen(true);
    setState("thinking");
    let reply: string;
    try {
      reply = await askAssistant(text);
    } catch {
      reply = "Asistana ulaşamadım, tekrar dener misin?";
    }
    setAnswer(reply);
    setState("speaking");
    speak(reply, () => setState("idle"));
  }, []);

  const startListening = useCallback(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      return;
    }
    stopSpeaking();
    const rec = new Recognition();
    rec.lang = "tr-TR";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalText = "";
    rec.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      finalText = text.trim();
      setQuestion(finalText);
      setOpen(true);
    };
    rec.onerror = () => setState("idle");
    rec.onend = () => {
      if (finalText) void ask(finalText);
      else setState("idle");
    };

    recRef.current = rec;
    try {
      rec.start();
      setState("listening");
      setOpen(true);
    } catch {
      setState("idle");
    }
  }, [ask]);

  const onClick = () => {
    if (state === "listening") {
      recRef.current?.stop();
      return;
    }
    if (state === "speaking") {
      stopSpeaking();
      setState("idle");
      return;
    }
    if (state === "thinking") return;
    startListening();
  };

  const active = state !== "idle";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={!supported}
        aria-label="Sesli asistan"
        title={supported ? "Sesli asistan (tr-TR)" : "Tarayıcı sesli girişi desteklemiyor"}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-md border transition-colors duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-40",
          active
            ? "border-gold/40 text-gold"
            : "border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        )}
      >
        {active && (
          <span className="live-dot absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-gold" />
        )}
        <Bot className="size-4" />
      </button>

      {open && (
        <div className="glass absolute right-0 top-11 z-50 w-80 rounded-[12px] border border-border p-4 text-left shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] text-gold">
              {LABEL[state]}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
          {question && (
            <p className="mb-2 text-xs text-muted-foreground">
              <span className="text-foreground">Sen:</span> {question}
            </p>
          )}
          {answer ? (
            <p className="text-sm text-foreground">{answer}</p>
          ) : (
            <p className="text-xs italic text-muted-foreground/70">
              {state === "listening" ? "Sorunu söyle…" : "…"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
