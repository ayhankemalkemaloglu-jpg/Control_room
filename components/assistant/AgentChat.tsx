"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";

import {
  chatWithAssistant,
  fetchAssistantConfigured,
  type AssistantMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export function AgentChat() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    fetchAssistantConfigured().then(setConfigured);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const speak = useCallback(
    (text: string) => {
      if (!autoSpeak || typeof window === "undefined" || !window.speechSynthesis) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "tr-TR";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    },
    [autoSpeak],
  );

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      setError(null);
      const next: AssistantMessage[] = [...messages, { role: "user", content }];
      setMessages(next);
      setInput("");
      setBusy(true);
      try {
        const reply = await chatWithAssistant(next);
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        speak(reply);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [messages, busy, speak],
  );
  sendRef.current = send;

  // Web Speech STT (tr-TR). On a final utterance, auto-send (hands-free).
  useEffect(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = "tr-TR";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalText = "";
    rec.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      finalText = text.trim();
      setInput(finalText);
    };
    rec.onend = () => {
      setListening(false);
      if (finalText) {
        sendRef.current(finalText);
        finalText = "";
      }
    };
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      rec.onresult = null;
      rec.onend = null;
      rec.onerror = null;
      rec.abort();
    };
  }, []);

  const micSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);

  const toggleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      setInput("");
      try {
        rec.start();
        setListening(true);
      } catch {
        /* already running */
      }
    }
  };

  return (
    <div className="glass flex h-full min-h-0 flex-col rounded-[12px] border border-border">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex flex-col">
          <span className="font-display text-sm text-foreground">Hermes ile Konuşma</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Canlı veriyle sohbet · sesli komut
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAutoSpeak((v) => !v)}
          title={autoSpeak ? "Sesli yanıt açık" : "Sesli yanıt kapalı"}
          className={cn(
            "flex size-8 items-center justify-center rounded-md border transition-colors",
            autoSpeak
              ? "border-gold/40 text-gold"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {autoSpeak ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>
      </header>

      {configured === false && (
        <div className="m-3 rounded-md border border-bearish/30 bg-bearish/5 px-3 py-2 text-xs text-bearish">
          Asistan yapılandırılmadı. Sunucuda <span className="font-mono">ASSISTANT_API_KEY</span>{" "}
          (ve <span className="font-mono">ASSISTANT_PROVIDER=minimax</span>) ayarlayıp{" "}
          <span className="font-mono">pm2 restart hermes-backend</span> yap.
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <span className="text-2xl">🤖</span>
            <p className="text-sm">Hermes&apos;e sor: &quot;Açık pozisyonlarım ne durumda?&quot;</p>
            <p className="text-xs">Yazabilir ya da mikrofona basıp konuşabilirsin.</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-[10px] px-3 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "ml-auto bg-secondary text-foreground"
                  : "mr-auto border border-border bg-background/40 text-foreground",
              )}
            >
              <span className="whitespace-pre-wrap">{m.content}</span>
            </div>
          ))
        )}
        {busy && (
          <div className="mr-auto flex items-center gap-1 rounded-[10px] border border-border px-3 py-2">
            <span className="size-1.5 animate-pulse rounded-full bg-gold" />
            <span className="text-xs text-muted-foreground">Hermes düşünüyor…</span>
          </div>
        )}
        {error && <p className="text-xs text-bearish">{error}</p>}
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        {micSupported && (
          <button
            type="button"
            onClick={toggleMic}
            title="Sesli sor (tr-TR)"
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-md border transition-colors",
              listening
                ? "border-gold/50 bg-gold/10 text-gold"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {listening ? <Mic className="size-4 animate-pulse" /> : <MicOff className="size-4" />}
          </button>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
          rows={1}
          placeholder={listening ? "Dinliyorum…" : "Hermes'e yaz…"}
          disabled={configured === false}
          className="max-h-32 min-h-[40px] flex-1 resize-none rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-gold/40 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => void send(input)}
          disabled={busy || configured === false || !input.trim()}
          className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-foreground transition-colors hover:border-gold/40 disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
