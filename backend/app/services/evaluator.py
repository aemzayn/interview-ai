import asyncio
from app.models.interview import InterviewSession
from app.models.results import AnswerScore, InterviewResults
from app.ai.factory import get_ai_provider
from app.services.session_store import get_session_store


async def evaluate_session(session: InterviewSession) -> InterviewResults:
    """Evaluate all answers concurrently, then generate overall feedback and persist."""
    provider = get_ai_provider()
    store = get_session_store()

    question_map = {q.question_id: q for q in session.questions}

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

    results = await provider.generate_overall_feedback(
        answer_scores=list(answer_scores),
        cv_profile=session.cv_profile,
        mode=session.mode,
        session_id=session.session_id,
    )

    # Persist to interview_results — include user linkage if authenticated.
    # This single write covers both the results-page lookup and the user history.
    await store.store_results(
        session_id=session.session_id,
        results=results,
        user_id=session.user_id,
        mode=session.mode.value,
        difficulty=session.difficulty.value,
    )

    return results
