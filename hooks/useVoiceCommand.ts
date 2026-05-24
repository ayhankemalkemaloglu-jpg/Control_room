"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useHermesStore } from "@/lib/store";

export interface VoiceCommand {
  supported: boolean;
  listening: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

/**
 * Web Speech API voice control (tr-TR). Recognised utterances containing a
 * layer name switch the active layer; the live transcript is mirrored into the
 * store for display.
 */
export function useVoiceCommand(): VoiceCommand {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const setActiveLayer = useHermesStore((s) => s.setActiveLayer);
  const setVoiceTranscript = useHermesStore((s) => s.setVoiceTranscript);

  useEffect(() => {
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recognition = new Recognition();
    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      text = text.trim();
      setTranscript(text);
      setVoiceTranscript(text);

      const lower = text.toLocaleLowerCase("tr-TR");
      if (lower.includes("türkiye") || lower.includes("turkiye")) {
        setActiveLayer("turkey");
      } else if (lower.includes("haber")) {
        setActiveLayer("news");
      } else if (lower.includes("dünya") || lower.includes("dunya")) {
        setActiveLayer("world");
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [setActiveLayer, setVoiceTranscript]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setTranscript("");
    try {
      recognition.start();
      setListening(true);
    } catch {
      /* recognition is already running — ignore */
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  return { supported, listening, transcript, start, stop, toggle };
}
