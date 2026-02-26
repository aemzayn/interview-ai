from pydantic import BaseModel, Field
from typing import Optional


class WorkExperience(BaseModel):
    company: str
    role: str
    duration: str
    highlights: list[str] = Field(default_factory=list)


class Education(BaseModel):
    institution: str
    degree: str
    field: str
    year: Optional[str] = None


class CVProfile(BaseModel):
    name: str = "Candidate"
    current_role: str = ""
    years_of_experience: float = 0
    skills: list[str] = Field(default_factory=list)
    work_experience: list[WorkExperience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    raw_text: str = ""


class CVUploadResponse(BaseModel):
    cv_session_token: str
    cv_profile: CVProfile
    message: str = "CV processed successfully"
