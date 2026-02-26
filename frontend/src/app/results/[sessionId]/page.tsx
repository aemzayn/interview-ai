"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInterviewStore } from "@/context/InterviewContext";
import { api } from "@/lib/api";
import type { InterviewResults } from "@/types";
import { ScoreRing } from "@/components/results/ScoreRing";
import { CategoryBreakdown } from "@/components/results/CategoryBreakdown";
import { AnswerReview } from "@/components/results/AnswerReview";
import { ImprovementTips } from "@/components/results/ImprovementTips";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const store = useInterviewStore();
  const sessionId = params.sessionId as string;

  // Use results from store if available, else fetch
  const [results, setResults] = useState<InterviewResults | null>(store.results);
  const [loading, setLoading] = useState(!store.results);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (store.results) {
      setResults(store.results);
      setLoading(false);
      return;
    }

    // Poll until results ready
    const interval = setInterval(async () => {
      try {
        const res = await api.getResults(sessionId);
        if (res) {
          clearInterval(interval);
          setResults(res);
          setLoading(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError(err instanceof Error ? err.message : "Failed to load results");
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, store.results]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto" />
          <h2 className="text-2xl font-bold">Evaluating your interview...</h2>
          <p className="text-gray-400">Analysing your answers with AI. This takes ~20 seconds.</p>
        </div>
      </main>
    );
  }

  if (error || !results) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl">❌</div>
          <h2 className="text-2xl font-bold">Failed to load results</h2>
          <p className="text-gray-400">{error}</p>
          <Button onClick={() => router.push("/setup")}>Try Again</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
          <Link href="/setup">
            <Button variant="secondary" size="sm">Practice Again</Button>
          </Link>
        </div>

        {/* Overall score */}
        <Card glass className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Interview Complete!</h1>
          <p className="text-gray-400">{results.summary}</p>
          <div className="flex justify-center py-4 relative">
            <ScoreRing score={results.overall_score} grade={results.grade} size={180} />
          </div>
        </Card>

        {/* Category breakdown */}
        {results.category_scores.length > 0 && (
          <Card>
            <h2 className="font-semibold text-lg mb-4">Category Scores</h2>
            <CategoryBreakdown categories={results.category_scores} />
          </Card>
        )}

        {/* Strengths + improvements */}
        <Card>
          <h2 className="font-semibold text-lg mb-4">Feedback & Resources</h2>
          <ImprovementTips
            strengths={results.top_strengths}
            improvements={results.top_improvements}
            resources={results.recommended_resources}
          />
        </Card>

        {/* Per-answer review */}
        {results.answer_reviews.length > 0 && (
          <Card>
            <h2 className="font-semibold text-lg mb-4">Answer Review</h2>
            <AnswerReview answers={results.answer_reviews} />
          </Card>
        )}

        {/* CTA */}
        <div className="text-center pb-8">
          <Link href="/setup">
            <Button size="lg">Practice Another Interview</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
