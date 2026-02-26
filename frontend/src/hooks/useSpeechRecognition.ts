"use client";

import { useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionOptions {
  /** Called with each speech segment. `isFinal=true` means the segment is committed. */
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  lang?: string;
}

interface UseSpeechRecognitionReturn {
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function useSpeechRecognition(
  options: SpeechRecognitionOptions,
): UseSpeechRecognitionReturn {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  /**
   * isListeningRef tracks *desired* state. When true and recognition ends
   * unexpectedly (silence timeout, network blip), we auto-restart.
   */
  const isListeningRef = useRef(false);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    if (isListeningRef.current) return; // already running
    isListeningRef.current = true;
    _createAndStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
  }, []);

  function _createAndStart() {
    if (!isSupported) return;
    const SpeechRecognitionImpl =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const rec = new SpeechRecognitionImpl();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = optionsRef.current.lang ?? "en-US";
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      // Process only new results starting from event.resultIndex.
      // Separate interim from final to avoid duplicating interim text on each
      // event (the browser accumulates finals and gives a fresh interim segment).
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }

      if (finalTranscript) {
        optionsRef.current.onResult(finalTranscript.trim(), true);
      }
      if (interimTranscript) {
        optionsRef.current.onResult(interimTranscript.trim(), false);
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      // no-speech / audio-capture are transient — recognition will end and
      // auto-restart via onend. Abort is from our own stopListening call.
      if (["no-speech", "audio-capture", "aborted"].includes(event.error)) return;
      optionsRef.current.onError?.(event.error);
    };

    rec.onend = () => {
      if (isListeningRef.current) {
        // Unexpected end (silence timeout, etc.) — restart after brief delay
        setTimeout(() => {
          if (isListeningRef.current) _createAndStart();
        }, 150);
      } else {
        optionsRef.current.onEnd?.();
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      // already started in a race
    }
  }

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    };
  }, []);

  return { startListening, stopListening, isSupported };
}
