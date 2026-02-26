"use client";

import { useCallback, useRef } from "react";

interface UseTTSReturn {
  speak: (text: string, onEnd?: () => void) => void;
  stop: () => void;
  isSupported: boolean;
}

export function useTTS(): UseTTSReturn {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
  }, [isSupported]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isSupported) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Prefer a natural-sounding English voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")),
      );
      if (preferred) utterance.voice = preferred;

      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported],
  );

  return { speak, stop, isSupported };
}
