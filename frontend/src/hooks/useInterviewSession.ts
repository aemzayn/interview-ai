"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInterviewStore } from "@/context/InterviewContext";
import { useTTS } from "./useTTS";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { api } from "@/lib/api";

export function useInterviewSession() {
  const router = useRouter();
  const store = useInterviewStore();
  const { speak, stop: stopTTS } = useTTS();

  /**
   * Two-ref transcript system:
   * - finalizedRef: space-joined text of all committed (isFinal) segments
   * - interimRef: the current interim (not-yet-final) text from the browser
   *
   * Using refs (not state) means STT callbacks never trigger re-renders.
   * The store's `liveTranscript` is updated as a single derived string.
   */
  const finalizedRef = useRef<string>("");
  const interimRef = useRef<string>("");
  const isSubmittingRef = useRef(false);

  const { startListening, stopListening } = useSpeechRecognition({
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        // Append committed text and clear interim
        finalizedRef.current = finalizedRef.current
          ? `${finalizedRef.current} ${transcript}`
          : transcript;
        interimRef.current = "";
      } else {
        // Replace interim (browser gives cumulative interim text each event)
        interimRef.current = transcript;
      }
      // Build one display string: all finals + current interim
      const display = [finalizedRef.current, interimRef.current]
        .filter(Boolean)
        .join(" ");
      store.setLiveTranscript(display);
    },
    onError: (error) => {
      console.warn("STT error:", error);
    },
  });

  /** Start listening after the user clicks "I'm ready to answer" (or countdown ends). */
  const startAnswering = useCallback(() => {
    finalizedRef.current = "";
    interimRef.current = "";
    store.setLiveTranscript("");
    store.setThinkingPhase(false);
    store.setIsUserSpeaking(true);
    startListening();
  }, [store, startListening]);

  /** Speak a question via TTS; when done, enter the thinking phase (not auto-listen). */
  const speakQuestion = useCallback(
    (text: string, onDone: () => void) => {
      store.setIsAISpeaking(true);
      speak(text, () => {
        store.setIsAISpeaking(false);
        onDone();
      });
    },
    [speak, store],
  );

  const startSession = useCallback(async (): Promise<string | null> => {
    const { cvSessionToken, selectedMode, difficulty, questionCount } = store;
    if (!cvSessionToken) return null;

    store.setSessionStatus("starting");
    try {
      const res = await api.startInterview({
        cv_session_token: cvSessionToken,
        mode: selectedMode,
        difficulty,
        question_count: questionCount,
      });

      store.setSession(res.session_id, res.question, res.total_questions);

      // Speak first question, then enter thinking phase
      speakQuestion(res.question.text, () => {
        store.setThinkingPhase(true);
      });

      return res.session_id;
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Failed to start interview");
      return null;
    }
  }, [store, speakQuestion]);

  const submitAnswer = useCallback(async () => {
    if (isSubmittingRef.current) return;
    if (!store.sessionId || !store.currentQuestion) return;

    isSubmittingRef.current = true;
    stopListening();
    store.setIsUserSpeaking(false);
    store.setThinkingPhase(false);
    store.setSessionStatus("submitting");

    // Capture whatever we have — finalized + any trailing interim
    const transcript =
      [finalizedRef.current, interimRef.current]
        .filter(Boolean)
        .join(" ")
        .trim() || "(no answer provided)";

    finalizedRef.current = "";
    interimRef.current = "";
    store.setLiveTranscript("");

    try {
      const res = await api.respond({
        session_id: store.sessionId,
        question_id: store.currentQuestion.question_id,
        transcript,
        duration_seconds: store.elapsedSeconds,
      });

      if (res.is_final || !res.next_question) {
        store.setSessionStatus("ending");
        await api.endInterview(store.sessionId);
        store.setSessionStatus("evaluating");
        _pollForResults(store.sessionId);
      } else {
        store.setCurrentQuestion(res.next_question, res.question_number!);
        store.setSessionStatus("active");
        speakQuestion(res.next_question.text, () => {
          store.setThinkingPhase(true);
        });
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Failed to submit answer");
    } finally {
      isSubmittingRef.current = false;
    }
  }, [store, stopListening, speakQuestion]);

  const _pollForResults = useCallback(
    (sessionId: string) => {
      const interval = setInterval(async () => {
        try {
          const results = await api.getResults(sessionId);
          if (results) {
            clearInterval(interval);
            store.setResults(results);
            router.push(`/results/${sessionId}`);
          }
        } catch {
          clearInterval(interval);
          store.setError("Failed to fetch results.");
        }
      }, 2000);
    },
    [store, router],
  );

  const endSessionEarly = useCallback(async () => {
    stopTTS();
    stopListening();
    store.setThinkingPhase(false);
    if (store.sessionId) {
      try {
        store.setSessionStatus("ending");
        await api.endInterview(store.sessionId);
        store.setSessionStatus("evaluating");
        _pollForResults(store.sessionId);
      } catch {
        store.setError("Failed to end session.");
      }
    }
  }, [store, stopTTS, stopListening, _pollForResults]);

  return { startSession, submitAnswer, startAnswering, endSessionEarly };
}
