"use client";

import { useState } from "react";
import type { AnswerScore } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { cn, scoreToColor } from "@/lib/utils";

interface AnswerReviewProps {
  answers: AnswerScore[];
}

export function AnswerReview({ answers }: AnswerReviewProps) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {answers.map((a, i) => (
        <div
          key={a.question_id}
          className="rounded-xl border border-white/10 overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === a.question_id ? null : a.question_id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm text-gray-500 shrink-0">Q{i + 1}</span>
              <span className="text-sm font-medium truncate">{a.question_text}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              <span className={cn("font-bold text-sm tabular-nums", scoreToColor(a.score))}>
                {a.score}%
              </span>
              <span className="text-gray-500 text-xs">{open === a.question_id ? "▲" : "▼"}</span>
            </div>
          </button>

          {open === a.question_id && (
            <div className="px-4 pb-4 space-y-4 border-t border-white/5">
              {a.transcript && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">Your answer</p>
                  <p className="text-sm text-gray-300 bg-white/5 rounded-lg p-3 leading-relaxed">
                    {a.transcript}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 font-medium mb-1.5">Feedback</p>
                <p className="text-sm text-gray-300">{a.feedback}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {a.strengths.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1.5">Strengths</p>
                    <ul className="space-y-1">
                      {a.strengths.map((s, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-emerald-400">
                          <span>✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {a.improvements.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1.5">Improvements</p>
                    <ul className="space-y-1">
                      {a.improvements.map((s, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-amber-400">
                          <span>→</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
