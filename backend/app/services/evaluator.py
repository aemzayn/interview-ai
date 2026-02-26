import asyncio
from app.models.interview import InterviewSession, InterviewMode
from app.models.results import AnswerScore, InterviewResults
from app.ai.factory import get_ai_provider
from app.services.session_store import get_session_store
from app.services.user_store import get_user_store


async def evaluate_session(session: InterviewSession) -> InterviewResults:
    """Evaluate all answers in a session concurrently, then generate overall feedback."""
    provider = get_ai_provider()
    store = get_session_store()

    # Build a map of question_id -> Question
    question_map = {q.question_id: q for q in session.questions}

    # Evaluate all answers concurrently
    tasks = [
        provider.evaluate_answer(
            question=question_map[answer.question_id],
            answer=answer,
            mode=session.mode,
            cv_profile=session.cv_profile,
        )
        for answer in session.answers
        if answer.question_id in question_map
    ]

    answer_scores: list[AnswerScore] = await asyncio.gather(*tasks)

    # Generate overall feedback
    results = await provider.generate_overall_feedback(
        answer_scores=list(answer_scores),
        cv_profile=session.cv_profile,
        mode=session.mode,
        session_id=session.session_id,
    )

    # Persist results in session store
    store.store_results(session.session_id, results)

    # Also persist to user history if session belongs to an authenticated user
    if session.user_id:
        get_user_store().add_result(
            user_id=session.user_id,
            results=results,
            mode=session.mode.value,
            difficulty=session.difficulty.value,
        )

    return results
