"use client";

import type { Resource } from "@/types";

interface ImprovementTipsProps {
  strengths: string[];
  improvements: string[];
  resources: Resource[];
}

export function ImprovementTips({ strengths, improvements, resources }: ImprovementTipsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <h3 className="font-semibold text-emerald-400 mb-3">Top Strengths</h3>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {improvements.length > 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
            <h3 className="font-semibold text-amber-400 mb-3">Areas to Improve</h3>
            <ul className="space-y-2">
              {improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-amber-400 mt-0.5">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {resources.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Recommended Resources</h3>
          <div className="space-y-2">
            {resources.map((r, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-start gap-3"
              >
                <span className="text-blue-400 mt-0.5">📚</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                    >
                      Open →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
