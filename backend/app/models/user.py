from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime


class User(BaseModel):
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    hashed_password: str
    display_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    user_id: str
    email: str
    display_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class SessionSummary(BaseModel):
    session_id: str
    mode: str
    difficulty: str
    overall_score: int
    grade: str
    total_questions: int
    date: str  # ISO string
    top_strengths: list[str] = Field(default_factory=list)
    top_improvements: list[str] = Field(default_factory=list)


class OverviewResponse(BaseModel):
    total_sessions: int
    average_score: float
    best_score: int
    worst_score: int
    most_common_strengths: list[str]
    most_common_improvements: list[str]
    ai_recommendation: str
    sessions: list[SessionSummary]
