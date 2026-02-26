from app.models.cv import CVProfile
from app.models.interview import InterviewMode
from app.models.results import AnswerScore


def build_overall_feedback_prompt(
    answer_scores: list[AnswerScore],
    cv_profile: CVProfile,
    mode: InterviewMode,
) -> str:
    answers_summary = "\n".join(
        f"Q{i+1}: {a.question_text}\n  Score: {a.score}/100\n  Summary: {a.feedback}"
        for i, a in enumerate(answer_scores)
    )
    avg_score = sum(a.score for a in answer_scores) / len(answer_scores) if answer_scores else 0

    return f"""You are a senior interview coach generating a comprehensive post-interview report.

CANDIDATE: {cv_profile.name} ({cv_profile.current_role or "Candidate"})
INTERVIEW MODE: {mode.value}
TOTAL QUESTIONS: {len(answer_scores)}
AVERAGE SCORE: {avg_score:.1f}/100

INDIVIDUAL QUESTION RESULTS:
{answers_summary}

Generate a comprehensive interview feedback report. Return a JSON object with:
- "overall_score": integer 0-100 (weighted average, accounting for question difficulty)
- "grade": "A", "B", "C", "D", or "F"
- "category_scores": array of objects, one per category seen:
    {{"category": "string", "score": integer 0-100, "label": "human-readable label"}}
- "top_strengths": array of 3 overall strengths as strings
- "top_improvements": array of 3 priority improvement areas as strings
- "recommended_resources": array of 2-4 objects:
    {{"title": "string", "url": null, "description": "string"}}
- "summary": 3-4 sentence overall narrative summary

Grade scale: A=90-100, B=80-89, C=70-79, D=60-69, F=below 60

Return ONLY valid JSON. No markdown fences."""


def build_overview_prompt(sessions_data: list[dict], candidate_name: str) -> str:
    sessions_text = "\n\n".join(
        f"Session {i+1} ({s['mode']} / {s['difficulty']} difficulty):\n"
        f"  Score: {s['score']}/100 (Grade {s['grade']})\n"
        f"  Strengths: {', '.join(s['strengths'][:2]) or 'N/A'}\n"
        f"  Improvements needed: {', '.join(s['improvements'][:2]) or 'N/A'}"
        for i, s in enumerate(sessions_data)
    )

    return f"""You are a professional career coach reviewing {candidate_name}'s interview practice history.

PRACTICE SESSIONS ({len(sessions_data)} total):
{sessions_text}

Based on this history, generate a personalised coaching overview. Return a JSON object with:
- "ai_recommendation": 4-6 sentence personalised coaching narrative covering:
    * What the candidate is doing well consistently
    * Their main recurring weakness/gap
    * Specific actionable advice to improve before their next real interview
    * One concrete exercise or resource to focus on

Return ONLY valid JSON. No markdown fences.
Example: {{"ai_recommendation": "..."}}"""


def build_cv_extraction_prompt(raw_text: str) -> str:
    return f"""Extract structured information from this CV/resume text.

CV TEXT:
\"\"\"{raw_text[:8000]}\"\"\"

Return a JSON object with exactly these fields:
- "name": candidate's full name (string, default "Candidate" if not found)
- "current_role": most recent job title (string, empty if not found)
- "years_of_experience": total years of professional experience (float, 0 if not found)
- "skills": array of technical and soft skills (strings, max 20)
- "work_experience": array of objects:
    {{"company": "string", "role": "string", "duration": "string", "highlights": ["string"]}}
  (max 5 entries, 3 highlights each)
- "education": array of objects:
    {{"institution": "string", "degree": "string", "field": "string", "year": "string or null"}}
  (max 3 entries)

Return ONLY valid JSON. No markdown fences. If a field cannot be determined, use empty string/array/0."""
