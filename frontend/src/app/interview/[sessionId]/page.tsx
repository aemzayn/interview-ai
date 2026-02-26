"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInterviewStore } from "@/context/InterviewContext";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import { CameraFeed } from "@/components/interview/CameraFeed";
import { AIAvatar } from "@/components/interview/AIAvatar";
import { QuestionDisplay } from "@/components/interview/QuestionDisplay";
import { TranscriptPanel } from "@/components/interview/TranscriptPanel";
import { ThinkingCountdown } from "@/components/interview/ThinkingCountdown";
import { MicButton } from "@/components/interview/MicButton";
import { InterviewTimer } from "@/components/interview/InterviewTimer";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { INTERVIEW_MODES } from "@/lib/constants";

export default function InterviewPage() {
  const router = useRouter();
  const store = useInterviewStore();
  const { endSessionEarly, startAnswering } = useInterviewSession();

  // Guard: if no session in store, redirect to setup
  useEffect(() => {
    if (!store.sessionId && store.sessionStatus === "idle") {
      router.replace("/setup");
    }
  }, [store.sessionId, store.sessionStatus, router]);

  if (store.sessionStatus === "evaluating" || store.sessionStatus === "ending") {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto" />
          <h2 className="text-2xl font-bold">Evaluating your interview...</h2>
          <p className="text-gray-400">This usually takes 15–30 seconds.</p>
        </div>
      </main>
    );
  }

  if (store.sessionStatus === "error") {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">❌</div>
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-gray-400">{store.errorMessage}</p>
          <Button onClick={() => router.push("/setup")}>Start Over</Button>
        </div>
      </main>
    );
  }

  const modeInfo = INTERVIEW_MODES[store.selectedMode];
  const progress =
    store.totalQuestions > 0 ? (store.questionNumber / store.totalQuestions) * 100 : 0;

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{modeInfo?.icon}</span>
            <span className="font-medium">{modeInfo?.label} Interview</span>
          </div>
          <div className="flex items-center gap-4">
            <InterviewTimer />
            <Button variant="ghost" size="sm" onClick={endSessionEarly}>
              End Early
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress} />

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column: camera + AI avatar */}
          <div className="space-y-4">
            <CameraFeed />
            <div className="rounded-xl bg-gray-900 border border-white/10 p-4">
              <AIAvatar />
            </div>
          </div>

          {/* Right column: question + answer area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Question card */}
            <div className="rounded-2xl bg-gray-900 border border-white/10 p-6 min-h-[140px]">
              <QuestionDisplay />
            </div>

            {/* Answer area — switches between thinking countdown and live transcript */}
            {store.thinkingPhase ? (
              <div className="rounded-2xl bg-gray-900 border border-white/10 p-6">
                <ThinkingCountdown onReady={startAnswering} maxSeconds={120} />
              </div>
            ) : (
              <>
                <TranscriptPanel />

                {/* Controls */}
                <div className="flex items-center justify-center gap-6 pt-2">
                  {store.isAISpeaking ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Spinner className="h-8 w-8" />
                      <p className="text-sm text-gray-400">AI is reading the question…</p>
                    </div>
                  ) : store.isUserSpeaking ? (
                    <MicButton />
                  ) : null}
                </div>

                {store.sessionStatus === "submitting" && (
                  <p className="text-center text-sm text-gray-400">Submitting answer…</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
