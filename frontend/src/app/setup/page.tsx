"use client";

import { useInterviewStore } from "@/context/InterviewContext";
import { CVUploader } from "@/components/setup/CVUploader";
import { ModeSelector } from "@/components/setup/ModeSelector";
import { SetupSummary } from "@/components/setup/SetupSummary";
import { Progress } from "@/components/ui/Progress";
import Link from "next/link";

const STEPS = ["Upload CV", "Choose Mode", "Review & Start"];

const STEP_MAP = { upload: 0, mode: 1, summary: 2 } as const;

export default function SetupPage() {
  const store = useInterviewStore();
  const stepIndex = STEP_MAP[store.setupPhase];

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Home
          </Link>
          <span className="text-sm text-gray-400">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            {STEPS.map((s, i) => (
              <span key={s} className={i === stepIndex ? "text-blue-400 font-semibold" : ""}>
                {s}
              </span>
            ))}
          </div>
          <Progress value={((stepIndex + 1) / STEPS.length) * 100} />
        </div>

        {/* Step content */}
        <div className="rounded-2xl bg-gray-900 border border-white/10 p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-6">{STEPS[stepIndex]}</h2>

          {store.setupPhase === "upload" && <CVUploader />}
          {store.setupPhase === "mode" && <ModeSelector />}
          {store.setupPhase === "summary" && <SetupSummary />}
        </div>
      </div>
    </main>
  );
}
