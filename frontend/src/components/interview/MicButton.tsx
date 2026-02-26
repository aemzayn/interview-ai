"use client";

import { useInterviewStore } from "@/context/InterviewContext";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import { Button } from "@/components/ui/Button";

export function MicButton() {
  const { sessionStatus } = useInterviewStore();
  const { submitAnswer } = useInterviewSession();

  const isLoading = sessionStatus === "submitting";

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={submitAnswer}
        disabled={isLoading}
        loading={isLoading}
        size="lg"
        variant="danger"
        className="h-16 w-16 rounded-full p-0 text-2xl ring-4 ring-red-500/30"
      >
        {!isLoading && "⏹"}
      </Button>
      <span className="text-xs text-gray-400">
        {isLoading ? "Submitting…" : "Done — submit answer"}
      </span>
    </div>
  );
}
