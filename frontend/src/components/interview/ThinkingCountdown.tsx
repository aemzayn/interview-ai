"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/lib/utils";

interface ThinkingCountdownProps {
  maxSeconds?: number;
  onReady: () => void;
}

export function ThinkingCountdown({ maxSeconds = 120, onReady }: ThinkingCountdownProps) {
  const [seconds, setSeconds] = useState(maxSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onReady();
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onReady]);

  const pct = (seconds / maxSeconds) * 100;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = seconds > 60 ? "#3b82f6" : seconds > 30 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      {/* Circular countdown */}
      <div className="relative inline-flex items-center justify-center" style={{ width: 128, height: 128 }}>
        <svg width={128} height={128} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={64} cy={64} r={radius} fill="none" stroke="#ffffff10" strokeWidth={8} />
          <circle
            cx={64}
            cy={64}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.5s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono tabular-nums" style={{ color }}>
            {formatDuration(seconds)}
          </span>
          <span className="text-xs text-gray-500">to think</span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm text-gray-400">Take your time — the mic is off.</p>
        <p className="text-xs text-gray-600">Start speaking when you're ready, or wait for the timer.</p>
      </div>

      <Button
        size="lg"
        onClick={onReady}
        className="gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
      >
        🎤 I&apos;m ready to answer
      </Button>
    </div>
  );
}
