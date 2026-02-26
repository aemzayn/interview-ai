"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { OverviewResponse } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn, scoreToColor } from "@/lib/utils";
import { INTERVIEW_MODES } from "@/lib/constants";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    api.users
      .overview()
      .then(setOverview)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <Spinner className="h-10 w-10 mx-auto" />
          <p className="text-gray-400">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </main>
    );
  }

  if (!overview) return null;

  const gradeColor = (g: string) =>
    g === "A" ? "text-emerald-400" : g === "B" ? "text-blue-400" : g === "C" ? "text-amber-400" : "text-red-400";

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Hey, {user?.display_name || user?.email?.split("@")[0]} 👋
            </h1>
            <p className="text-gray-400 mt-1">Here&apos;s your interview practice overview.</p>
          </div>
          <Link href="/setup">
            <Button>Start Practice</Button>
          </Link>
        </div>

        {overview.total_sessions === 0 ? (
          /* Empty state */
          <Card glass className="text-center py-16 space-y-4">
            <div className="text-6xl">🎯</div>
            <h2 className="text-2xl font-bold">No sessions yet</h2>
            <p className="text-gray-400 max-w-sm mx-auto">
              Complete your first interview to see your scores, trends, and personalised AI coaching.
            </p>
            <Link href="/setup">
              <Button size="lg" className="mt-2">Start Your First Interview</Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Sessions", value: overview.total_sessions, suffix: "" },
                { label: "Avg Score", value: `${overview.average_score}`, suffix: "/100" },
                { label: "Best Score", value: overview.best_score, suffix: "" },
                { label: "Worst Score", value: overview.worst_score, suffix: "" },
              ].map((stat) => (
                <Card key={stat.label} className="text-center py-4">
                  <p className="text-3xl font-bold text-blue-400">{stat.value}<span className="text-lg text-gray-500">{stat.suffix}</span></p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </Card>
              ))}
            </div>

            {/* AI Recommendation */}
            <Card glass className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <h2 className="font-semibold text-lg">AI Coaching Recommendation</h2>
              </div>
              <p className="text-gray-300 leading-relaxed">{overview.ai_recommendation}</p>
            </Card>

            {/* Common patterns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {overview.most_common_strengths.length > 0 && (
                <Card className="space-y-3">
                  <h3 className="font-semibold text-emerald-400">Recurring Strengths</h3>
                  <ul className="space-y-2">
                    {overview.most_common_strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-emerald-400 mt-0.5">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {overview.most_common_improvements.length > 0 && (
                <Card className="space-y-3">
                  <h3 className="font-semibold text-amber-400">Focus Areas</h3>
                  <ul className="space-y-2">
                    {overview.most_common_improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-amber-400 mt-0.5">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            {/* Session history */}
            <div>
              <h2 className="font-semibold text-lg mb-4">Past Sessions</h2>
              <div className="space-y-3">
                {overview.sessions.map((s) => {
                  const modeInfo = INTERVIEW_MODES[s.mode as keyof typeof INTERVIEW_MODES];
                  return (
                    <Link key={s.session_id} href={`/results/${s.session_id}`}>
                      <div className="rounded-xl bg-gray-900 border border-white/10 hover:border-white/25 p-4 transition-all flex items-center gap-4 cursor-pointer">
                        <div className="text-2xl">{modeInfo?.icon ?? "🎯"}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{modeInfo?.label ?? s.mode} — {s.difficulty}</p>
                          <p className="text-xs text-gray-500">{s.total_questions} questions</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn("text-2xl font-bold tabular-nums", scoreToColor(s.overall_score))}>
                            {s.overall_score}
                          </p>
                          <p className={cn("text-sm font-semibold", gradeColor(s.grade))}>{s.grade}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
