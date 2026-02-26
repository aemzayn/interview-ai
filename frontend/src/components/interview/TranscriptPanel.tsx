"use client";

import { useInterviewStore } from "@/context/InterviewContext";
import { useEffect, useRef } from "react";

export function TranscriptPanel() {
  const { liveTranscript, isUserSpeaking } = useInterviewStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveTranscript]);

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 min-h-[120px] max-h-[200px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`h-2 w-2 rounded-full transition-colors ${
            isUserSpeaking ? "bg-red-400 animate-pulse" : "bg-gray-600"
          }`}
        />
        <span className="text-xs text-gray-400 font-medium">Your answer</span>
      </div>

      {liveTranscript ? (
        <p className="text-sm text-gray-200 leading-relaxed">{liveTranscript}</p>
      ) : (
        <p className="text-gray-600 text-sm italic">
          {isUserSpeaking ? "Listening — speak your answer..." : "Your answer will appear here."}
        </p>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
