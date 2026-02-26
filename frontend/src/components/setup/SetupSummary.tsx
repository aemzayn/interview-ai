"use client";

import { useRouter } from "next/navigation";
import { useInterviewStore } from "@/context/InterviewContext";
import { INTERVIEW_MODES, DIFFICULTIES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import { useState } from "react";

export function SetupSummary() {
  const store = useInterviewStore();
  const { startSession } = useInterviewSession();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const modeInfo = INTERVIEW_MODES[store.selectedMode];
  const diffInfo = DIFFICULTIES[store.difficulty];

  const handleStart = async () => {
    setIsStarting(true);
    const sessionId = await startSession();
    if (sessionId) {
      router.push(`/interview/${sessionId}`);
    } else {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6">
      {store.cvProfile && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
          <p className="text-sm text-gray-400">Candidate</p>
          <p className="font-semibold text-lg">{store.cvProfile.name}</p>
          <p className="text-gray-400 text-sm">{store.cvProfile.current_role}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {store.cvProfile.skills.slice(0, 6).map((skill) => (
              <Badge key={skill} variant="info">{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
          <div className="text-2xl mb-1">{modeInfo.icon}</div>
          <p className="text-xs text-gray-400">Mode</p>
          <p className="font-semibold text-sm">{modeInfo.label}</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
          <div className="text-2xl mb-1">⚡</div>
          <p className="text-xs text-gray-400">Difficulty</p>
          <p className="font-semibold text-sm">{diffInfo.label}</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
          <div className="text-2xl mb-1">❓</div>
          <p className="text-xs text-gray-400">Questions</p>
          <p className="font-semibold text-sm">{store.questionCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          className="w-full"
          size="lg"
          loading={isStarting}
          onClick={handleStart}
        >
          {isStarting ? "Generating questions..." : "Start Interview"}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => store.setSetupPhase("mode")}
          disabled={isStarting}
        >
          ← Back
        </Button>
      </div>
    </div>
  );
}
