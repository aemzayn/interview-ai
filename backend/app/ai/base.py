from abc import ABC, abstractmethod
from typing import Optional

from app.models.cv import CVProfile
from app.models.interview import Question, Answer, InterviewMode, Difficulty
from app.models.results import AnswerScore, InterviewResults


class AIProvider(ABC):
    """Abstract base class for all AI provider implementations."""

    @abstractmethod
    async def extract_cv_profile(self, raw_text: str) -> CVProfile:
        """Parse raw CV text into a structured CVProfile."""
        ...

    @abstractmethod
    async def generate_questions(
        self,
        cv_profile: CVProfile,
        mode: InterviewMode,
        difficulty: Difficulty,
        count: int,
    ) -> list[Question]:
        """Generate a personalised question bank for the interview."""
        ...

    @abstractmethod
    async def evaluate_answer(
        self,
        question: Question,
        answer: Answer,
        mode: InterviewMode,
        cv_profile: CVProfile,
    ) -> AnswerScore:
        """Score a single answer and return structured feedback."""
        ...

    @abstractmethod
    async def generate_overall_feedback(
        self,
        answer_scores: list[AnswerScore],
        cv_profile: CVProfile,
        mode: InterviewMode,
        session_id: str,
    ) -> InterviewResults:
        """Aggregate all answer scores into a complete InterviewResults report."""
        ...
