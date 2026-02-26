"use client";

import { useEffect, useRef } from "react";
import { useInterviewStore } from "@/context/InterviewContext";
import { formatDuration } from "@/lib/utils";

export function InterviewTimer() {
  const { elapsedSeconds, setElapsedSeconds, sessionStatus } = useInterviewStore();
  const startTimeRef = useRef<number | null>(null);
  const baseRef = useRef<number>(0);

  useEffect(() => {
    if (sessionStatus !== "active" && sessionStatus !== "submitting") {
      startTimeRef.current = null;
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      baseRef.current = elapsedSeconds;
    }

    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
      setElapsedSeconds(baseRef.current + elapsed);
    }, 1000);

    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  return (
    <span className="font-mono text-sm text-gray-400">{formatDuration(elapsedSeconds)}</span>
  );
}
