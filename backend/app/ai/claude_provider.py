import json
import anthropic

from app.ai.base import AIProvider
from app.config import get_settings
from app.models.cv import CVProfile, WorkExperience, Education
from app.models.interview import Question, Answer, InterviewMode, Difficulty
from app.models.results import AnswerScore, InterviewResults, CategoryScore, Resource, score_to_grade
from app.prompts.question_prompts import build_question_prompt, build_evaluation_prompt
from app.prompts.evaluation_prompts import build_overall_feedback_prompt, build_cv_extraction_prompt


class ClaudeProvider(AIProvider):
    def __init__(self):
        settings = get_settings()
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._model = settings.claude_model

    async def _chat(self, prompt: str, max_tokens: int = 4096) -> str:
        message = await self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

    async def extract_cv_profile(self, raw_text: str) -> CVProfile:
        prompt = build_cv_extraction_prompt(raw_text)
        response = await self._chat(prompt)
        data = json.loads(response.strip())
        return CVProfile(
            name=data.get("name", "Candidate"),
            current_role=data.get("current_role", ""),
            years_of_experience=float(data.get("years_of_experience", 0)),
            skills=data.get("skills", []),
            work_experience=[WorkExperience(**e) for e in data.get("work_experience", [])],
            education=[Education(**e) for e in data.get("education", [])],
            raw_text=raw_text,
        )

    async def generate_questions(
        self,
        cv_profile: CVProfile,
        mode: InterviewMode,
        difficulty: Difficulty,
        count: int,
    ) -> list[Question]:
        prompt = build_question_prompt(cv_profile, mode, difficulty, count)
        response = await self._chat(prompt)
        items = json.loads(response.strip())
        return [
            Question(
                text=item["text"],
                category=item.get("category", "General"),
                follow_up_hint=item.get("follow_up_hint"),
            )
            for item in items
        ]

    async def evaluate_answer(
        self,
        question: Question,
        answer: Answer,
        mode: InterviewMode,
        cv_profile: CVProfile,
    ) -> AnswerScore:
        prompt = build_evaluation_prompt(
            question_text=question.text,
            transcript=answer.transcript,
            category=question.category,
            mode=mode,
            candidate_name=cv_profile.name,
        )
        response = await self._chat(prompt)
        data = json.loads(response.strip())
        return AnswerScore(
            question_id=question.question_id,
            question_text=question.text,
            transcript=answer.transcript,
            score=int(data["score"]),
            feedback=data["feedback"],
            strengths=data.get("strengths", []),
            improvements=data.get("improvements", []),
        )

    async def generate_overall_feedback(
        self,
        answer_scores: list[AnswerScore],
        cv_profile: CVProfile,
        mode: InterviewMode,
        session_id: str,
    ) -> InterviewResults:
        prompt = build_overall_feedback_prompt(answer_scores, cv_profile, mode)
        response = await self._chat(prompt, max_tokens=2048)
        data = json.loads(response.strip())
        overall_score = int(data.get("overall_score", 0))
        return InterviewResults(
            session_id=session_id,
            overall_score=overall_score,
            grade=data.get("grade", score_to_grade(overall_score)),
            category_scores=[CategoryScore(**c) for c in data.get("category_scores", [])],
            answer_reviews=answer_scores,
            top_strengths=data.get("top_strengths", []),
            top_improvements=data.get("top_improvements", []),
            recommended_resources=[Resource(**r) for r in data.get("recommended_resources", [])],
            summary=data.get("summary", ""),
        )
