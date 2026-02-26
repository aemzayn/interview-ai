from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum
import uuid
from datetime import datetime

from app.models.cv import CVProfile


class InterviewMode(str, Enum):
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    SYSTEM_DESIGN = "system_design"
    MIXED = "mixed"
    HR = "hr"


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    EVALUATING = "evaluating"
    EVALUATED = "evaluated"
    ERROR = "error"


class Question(BaseModel):
    question_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    category: str
    follow_up_hint: Optional[str] = None


class Answer(BaseModel):
    question_id: str
    transcript: str
    duration_seconds: float = 0


class InterviewSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cv_profile: CVProfile
    mode: InterviewMode
    difficulty: Difficulty
    questions: list[Question] = Field(default_factory=list)
    answers: list[Answer] = Field(default_factory=list)
    current_question_index: int = 0
    status: SessionStatus = SessionStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None  # set when authenticated user starts interview


# --- DTOs ---

class StartInterviewRequest(BaseModel):
    cv_session_token: str
    mode: InterviewMode
    difficulty: Difficulty = Difficulty.MEDIUM
    question_count: int = Field(default=5, ge=1, le=20)


class StartInterviewResponse(BaseModel):
    session_id: str
    question: Question
    question_number: int
    total_questions: int


class RespondRequest(BaseModel):
    session_id: str
    question_id: str
    transcript: str
    duration_seconds: float = 0


class RespondResponse(BaseModel):
    next_question: Optional[Question] = None
    question_number: Optional[int] = None
    total_questions: Optional[int] = None
    is_final: bool = False


class EndInterviewRequest(BaseModel):
    session_id: str
