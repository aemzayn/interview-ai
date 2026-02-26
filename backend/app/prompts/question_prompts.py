from app.models.cv import CVProfile
from app.models.interview import InterviewMode, Difficulty

DIFFICULTY_GUIDANCE = {
    "easy": "Ask straightforward questions suitable for entry-level candidates. Focus on fundamentals and basic scenarios.",
    "medium": "Ask moderately complex questions. Include situational and competency-based questions.",
    "hard": "Ask challenging, in-depth questions. Probe edge cases, trade-offs, and senior-level thinking.",
}

MODE_GUIDANCE = {
    "behavioral": "Focus exclusively on past behaviour using STAR method prompts (Situation, Task, Action, Result). Ask about teamwork, conflict, failure, leadership.",
    "technical": "Ask technical questions highly specific to the candidate's skill set and experience. Include coding concepts, architecture decisions, and debugging scenarios.",
    "system_design": "Ask about designing scalable systems relevant to the candidate's background. Focus on architecture, trade-offs, scalability, and reliability.",
    "mixed": "Mix behavioral, technical, and situational questions in roughly equal proportion.",
    "hr": "Ask HR-focused questions: motivation, career goals, salary expectations, company culture fit, strengths/weaknesses.",
}


def build_question_prompt(
    cv_profile: CVProfile,
    mode: InterviewMode,
    difficulty: Difficulty,
    count: int,
) -> str:
    skills = ", ".join(cv_profile.skills[:15]) if cv_profile.skills else "general skills"
    experience_summary = "\n".join(
        f"- {exp.role} at {exp.company} ({exp.duration}): {', '.join(exp.highlights[:2])}"
        for exp in cv_profile.work_experience[:3]
    ) or "No specific work experience listed."

    return f"""You are an expert interview coach generating personalised interview questions.

CANDIDATE PROFILE:
- Name: {cv_profile.name}
- Current Role: {cv_profile.current_role or "Not specified"}
- Years of Experience: {cv_profile.years_of_experience}
- Key Skills: {skills}
- Work Experience:
{experience_summary}

INTERVIEW SETTINGS:
- Mode: {mode.value.upper()} — {MODE_GUIDANCE.get(mode.value, "")}
- Difficulty: {difficulty.value.upper()} — {DIFFICULTY_GUIDANCE.get(difficulty.value, "")}
- Number of questions to generate: {count}

INSTRUCTIONS:
Generate exactly {count} interview questions tailored specifically to this candidate's background.
Each question must reference their actual skills, experience, or background where possible.

Return a JSON array with exactly {count} objects. Each object must have:
- "text": the full question text (string)
- "category": one of "Behavioral", "Technical", "System Design", "HR", "Situational" (string)
- "follow_up_hint": a brief hint for the interviewer on what a good answer should include (string)

Return ONLY valid JSON. No markdown fences, no explanation.
Example format:
[
  {{"text": "Question text here?", "category": "Behavioral", "follow_up_hint": "Look for STAR format"}}
]"""


def build_evaluation_prompt(
    question_text: str,
    transcript: str,
    category: str,
    mode: InterviewMode,
    candidate_name: str,
    difficulty: str = "medium",
) -> str:
    return f"""You are a senior interview evaluator assessing a candidate's answer.

QUESTION: {question_text}
CATEGORY: {category}
INTERVIEW MODE: {mode.value}
DIFFICULTY: {difficulty}
CANDIDATE: {candidate_name}

CANDIDATE'S ANSWER (transcribed from speech):
\"\"\"{transcript}\"\"\"

Evaluate this answer on a scale of 0-100 and provide structured feedback.

Return a JSON object with exactly these fields:
- "score": integer 0-100
- "feedback": 2-3 sentence overall assessment (string)
- "strengths": array of 1-3 specific strengths demonstrated (strings)
- "improvements": array of 1-3 specific areas for improvement (strings)

Scoring rubric:
- 90-100: Exceptional, exceeds expectations with concrete examples and deep insight
- 70-89: Good, covers main points with some examples
- 50-69: Adequate, addresses the question but lacks depth or specifics
- 30-49: Weak, misses key aspects or gives vague answers
- 0-29: Poor, irrelevant or very insufficient answer

Return ONLY valid JSON. No markdown fences."""
