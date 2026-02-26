"use client";

import { useInterviewStore } from "@/context/InterviewContext";
import { INTERVIEW_MODES, DIFFICULTIES, QUESTION_COUNT_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { InterviewMode, Difficulty } from "@/types";

export function ModeSelector() {
  const store = useInterviewStore();

  return (
    <div className="space-y-8">
      {/* Mode */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-300">Interview Mode</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(INTERVIEW_MODES).map(([key, mode]) => {
            const isSelected = store.selectedMode === key;
            return (
              <button
                key={key}
                onClick={() => store.setMode(key as InterviewMode)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 hover:border-white/25 hover:bg-white/5",
                )}
              >
                <span className="text-2xl">{mode.icon}</span>
                <div>
                  <p className="font-medium">{mode.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{mode.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-300">Difficulty</h3>
        <div className="flex gap-3">
          {Object.entries(DIFFICULTIES).map(([key, diff]) => {
            const isSelected = store.difficulty === key;
            return (
              <button
                key={key}
                onClick={() => store.setDifficulty(key as Difficulty)}
                className={cn(
                  "flex-1 rounded-xl border p-3 text-sm text-center transition-all",
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 text-blue-400 font-semibold"
                    : "border-white/10 hover:border-white/25 text-gray-400",
                )}
              >
                {diff.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question count */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-300">Number of Questions</h3>
        <div className="flex gap-3">
          {QUESTION_COUNT_OPTIONS.map((n) => {
            const isSelected = store.questionCount === n;
            return (
              <button
                key={n}
                onClick={() => store.setQuestionCount(n)}
                className={cn(
                  "h-12 w-16 rounded-xl border text-sm font-medium transition-all",
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-white/10 hover:border-white/25 text-gray-400",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={() => store.setSetupPhase("summary")}
      >
        Continue →
      </Button>
    </div>
  );
}
