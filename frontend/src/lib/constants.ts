import type { InterviewMode, Difficulty } from "@/types";

export const INTERVIEW_MODES: Record<
  InterviewMode,
  { label: string; description: string; icon: string; color: string }
> = {
  behavioral: {
    label: "Behavioral",
    description: "STAR-method questions about past experiences, teamwork, and leadership.",
    icon: "🧠",
    color: "bg-blue-500",
  },
  technical: {
    label: "Technical",
    description: "In-depth coding, architecture, and domain-specific technical questions.",
    icon: "💻",
    color: "bg-violet-500",
  },
  system_design: {
    label: "System Design",
    description: "Design scalable systems, architecture discussions, and trade-off analysis.",
    icon: "🏗️",
    color: "bg-amber-500",
  },
  mixed: {
    label: "Mixed",
    description: "A balanced blend of behavioral, technical, and situational questions.",
    icon: "🎯",
    color: "bg-emerald-500",
  },
  hr: {
    label: "HR Round",
    description: "Motivation, culture fit, salary expectations, and career goals.",
    icon: "🤝",
    color: "bg-rose-500",
  },
};

export const DIFFICULTIES: Record<Difficulty, { label: string; description: string }> = {
  easy: { label: "Easy", description: "Entry-level, fundamental questions" },
  medium: { label: "Medium", description: "Mid-level, situational questions" },
  hard: { label: "Hard", description: "Senior-level, in-depth questions" },
};

export const QUESTION_COUNT_OPTIONS = [3, 5, 7, 10];
