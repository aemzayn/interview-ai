"use client";

import { useInterviewStore } from "@/context/InterviewContext";
import { cn } from "@/lib/utils";

export function AIAvatar() {
  const { isAISpeaking } = useInterviewStore();

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "relative h-20 w-20 rounded-full flex items-center justify-center text-3xl transition-all duration-300",
          isAISpeaking
            ? "bg-blue-600/30 ring-4 ring-blue-500/50 animate-pulse-slow"
            : "bg-gray-800",
        )}
      >
        🤖
        {isAISpeaking && (
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-[8px]">🔊</span>
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400">
        {isAISpeaking ? "AI is speaking..." : "AI Interviewer"}
      </p>
    </div>
  );
}
