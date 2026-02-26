"use client";

import { create } from "zustand";
import type {
  CVProfile,
  InterviewMode,
  Difficulty,
  Question,
  InterviewResults,
} from "@/types";

type SetupPhase = "upload" | "mode" | "summary";
type SessionStatus = "idle" | "starting" | "active" | "submitting" | "ending" | "evaluating" | "done" | "error";

interface InterviewStore {
  // Setup state
  setupPhase: SetupPhase;
  cvProfile: CVProfile | null;
  cvSessionToken: string | null;
  selectedMode: InterviewMode;
  difficulty: Difficulty;
  questionCount: number;

  // Session state
  sessionId: string | null;
  sessionStatus: SessionStatus;
  currentQuestion: Question | null;
  questionNumber: number;
  totalQuestions: number;
  /** Live transcript display — a single string (finals + current interim, reset per question) */
  liveTranscript: string;
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  /** True after AI finishes speaking, before user clicks "I'm ready" */
  thinkingPhase: boolean;
  elapsedSeconds: number;

  // Results
  results: InterviewResults | null;
  errorMessage: string | null;

  // Actions
  setSetupPhase: (phase: SetupPhase) => void;
  setCVData: (profile: CVProfile, token: string) => void;
  setMode: (mode: InterviewMode) => void;
  setDifficulty: (d: Difficulty) => void;
  setQuestionCount: (n: number) => void;
  setSession: (sessionId: string, question: Question, total: number) => void;
  setCurrentQuestion: (question: Question, number: number) => void;
  setLiveTranscript: (text: string) => void;
  setIsAISpeaking: (v: boolean) => void;
  setIsUserSpeaking: (v: boolean) => void;
  setThinkingPhase: (v: boolean) => void;
  setElapsedSeconds: (n: number) => void;
  setSessionStatus: (s: SessionStatus) => void;
  setResults: (results: InterviewResults) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

const initialState = {
  setupPhase: "upload" as SetupPhase,
  cvProfile: null,
  cvSessionToken: null,
  selectedMode: "behavioral" as InterviewMode,
  difficulty: "medium" as Difficulty,
  questionCount: 5,
  sessionId: null,
  sessionStatus: "idle" as SessionStatus,
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 0,
  liveTranscript: "",
  isAISpeaking: false,
  isUserSpeaking: false,
  thinkingPhase: false,
  elapsedSeconds: 0,
  results: null,
  errorMessage: null,
};

export const useInterviewStore = create<InterviewStore>((set) => ({
  ...initialState,

  setSetupPhase: (phase) => set({ setupPhase: phase }),
  setCVData: (profile, token) => set({ cvProfile: profile, cvSessionToken: token }),
  setMode: (mode) => set({ selectedMode: mode }),
  setDifficulty: (d) => set({ difficulty: d }),
  setQuestionCount: (n) => set({ questionCount: n }),

  setSession: (sessionId, question, total) =>
    set({
      sessionId,
      currentQuestion: question,
      questionNumber: 1,
      totalQuestions: total,
      sessionStatus: "active",
    }),

  setCurrentQuestion: (question, number) =>
    set({ currentQuestion: question, questionNumber: number }),

  setLiveTranscript: (text) => set({ liveTranscript: text }),
  setIsAISpeaking: (v) => set({ isAISpeaking: v }),
  setIsUserSpeaking: (v) => set({ isUserSpeaking: v }),
  setThinkingPhase: (v) => set({ thinkingPhase: v }),
  setElapsedSeconds: (n) => set({ elapsedSeconds: n }),
  setSessionStatus: (s) => set({ sessionStatus: s }),
  setResults: (results) => set({ results, sessionStatus: "done" }),
  setError: (msg) => set({ errorMessage: msg, sessionStatus: "error" }),
  reset: () => set(initialState),
}));
