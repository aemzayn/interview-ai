// ── Auth Types ───────────────────────────────────────────────────────────────

export interface UserPublic {
  user_id: string;
  email: string;
  display_name?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserPublic;
}

export interface SessionSummary {
  session_id: string;
  mode: string;
  difficulty: string;
  overall_score: number;
  grade: string;
  total_questions: number;
  date: string;
  top_strengths: string[];
  top_improvements: string[];
}

export interface OverviewResponse {
  total_sessions: number;
  average_score: number;
  best_score: number;
  worst_score: number;
  most_common_strengths: string[];
  most_common_improvements: string[];
  ai_recommendation: string;
  sessions: SessionSummary[];
}

// ── CV Types ────────────────────────────────────────────────────────────────

export interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  highlights: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year?: string;
}

export interface CVProfile {
  name: string;
  current_role: string;
  years_of_experience: number;
  skills: string[];
  work_experience: WorkExperience[];
  education: Education[];
  raw_text: string;
}

export interface CVUploadResponse {
  cv_session_token: string;
  cv_profile: CVProfile;
  message: string;
}

// ── Interview Types ──────────────────────────────────────────────────────────

export type InterviewMode = "behavioral" | "technical" | "system_design" | "mixed" | "hr";
export type Difficulty = "easy" | "medium" | "hard";
export type SessionStatus = "active" | "completed" | "evaluating" | "evaluated" | "error";

export interface Question {
  question_id: string;
  text: string;
  category: string;
  follow_up_hint?: string;
}

export interface StartInterviewRequest {
  cv_session_token: string;
  mode: InterviewMode;
  difficulty: Difficulty;
  question_count: number;
}

export interface StartInterviewResponse {
  session_id: string;
  question: Question;
  question_number: number;
  total_questions: number;
}

export interface RespondRequest {
  session_id: string;
  question_id: string;
  transcript: string;
  duration_seconds: number;
}

export interface RespondResponse {
  next_question?: Question;
  question_number?: number;
  total_questions?: number;
  is_final: boolean;
}

// ── Results Types ────────────────────────────────────────────────────────────

export interface AnswerScore {
  question_id: string;
  question_text: string;
  transcript: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface CategoryScore {
  category: string;
  score: number;
  label: string;
}

export interface Resource {
  title: string;
  url?: string;
  description: string;
}

export interface InterviewResults {
  session_id: string;
  overall_score: number;
  grade: string;
  category_scores: CategoryScore[];
  answer_reviews: AnswerScore[];
  top_strengths: string[];
  top_improvements: string[];
  recommended_resources: Resource[];
  summary: string;
}
