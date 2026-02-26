from app.models.cv import CVProfile
from app.models.interview import Question, InterviewMode, Difficulty
from app.ai.factory import get_ai_provider


async def generate_questions(
    cv_profile: CVProfile,
    mode: InterviewMode,
    difficulty: Difficulty,
    count: int,
) -> list[Question]:
    provider = get_ai_provider()
    return await provider.generate_questions(cv_profile, mode, difficulty, count)
