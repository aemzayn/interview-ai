"use client";

import { useInterviewStore } from "@/context/InterviewContext";
import { Badge } from "@/components/ui/Badge";

export function QuestionDisplay() {
  const { currentQuestion, questionNumber, totalQuestions } = useInterviewStore();

  if (!currentQuestion) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="info">Q{questionNumber} of {totalQuestions}</Badge>
        <Badge>{currentQuestion.category}</Badge>
      </div>
      <p className="text-xl font-medium leading-relaxed">{currentQuestion.text}</p>
    </div>
  );
}
