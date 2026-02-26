from pydantic import BaseModel, Field
from typing import Optional


class AnswerScore(BaseModel):
    question_id: str
    question_text: str
    transcript: str
    score: int = Field(ge=0, le=100)
    feedback: str
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)


class CategoryScore(BaseModel):
    category: str
    score: int = Field(ge=0, le=100)
    label: str  # e.g. "Communication", "Technical Depth"


class Resource(BaseModel):
    title: str
    url: Optional[str] = None
    description: str


class InterviewResults(BaseModel):
    session_id: str
    overall_score: int = Field(ge=0, le=100)
    grade: str  # A, B, C, D, F
    category_scores: list[CategoryScore] = Field(default_factory=list)
    answer_reviews: list[AnswerScore] = Field(default_factory=list)
    top_strengths: list[str] = Field(default_factory=list)
    top_improvements: list[str] = Field(default_factory=list)
    recommended_resources: list[Resource] = Field(default_factory=list)
    summary: str = ""


def score_to_grade(score: int) -> str:
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    else:
        return "F"
