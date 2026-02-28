import json
from collections import Counter
from fastapi import APIRouter, HTTPException, Request

from app.models.user import SessionSummary, OverviewResponse
from app.services.user_store import get_user_store
from app.auth.jwt_utils import get_optional_user_id
from app.ai.factory import get_ai_provider
from app.prompts.evaluation_prompts import build_overview_prompt

router = APIRouter()


def _require_user(request: Request) -> str:
    user_id = get_optional_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user_id


@router.get("/me/history", response_model=list[SessionSummary])
async def get_history(request: Request):
    user_id = _require_user(request)
    history = await get_user_store().get_history(user_id)

    return [
        SessionSummary(
            session_id=results.session_id,
            mode=mode,
            difficulty=difficulty,
            overall_score=results.overall_score,
            grade=results.grade,
            total_questions=len(results.answer_reviews),
            date="",
            top_strengths=results.top_strengths[:3],
            top_improvements=results.top_improvements[:3],
        )
        for results, mode, difficulty in reversed(history)  # newest first
    ]


@router.get("/me/overview", response_model=OverviewResponse)
async def get_overview(request: Request):
    user_id = _require_user(request)
    store = get_user_store()

    user = await store.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    history = await store.get_history(user_id)
    if not history:
        return OverviewResponse(
            total_sessions=0,
            average_score=0,
            best_score=0,
            worst_score=0,
            most_common_strengths=[],
            most_common_improvements=[],
            ai_recommendation="Complete your first interview session to receive personalised coaching recommendations.",
            sessions=[],
        )

    scores = [r.overall_score for r, _, _ in history]
    all_strengths = [s for r, _, _ in history for s in r.top_strengths]
    all_improvements = [s for r, _, _ in history for s in r.top_improvements]

    sessions = [
        SessionSummary(
            session_id=results.session_id,
            mode=mode,
            difficulty=difficulty,
            overall_score=results.overall_score,
            grade=results.grade,
            total_questions=len(results.answer_reviews),
            date="",
            top_strengths=results.top_strengths[:2],
            top_improvements=results.top_improvements[:2],
        )
        for results, mode, difficulty in reversed(history)
    ]

    sessions_data = [
        {
            "mode": mode,
            "difficulty": difficulty,
            "score": results.overall_score,
            "grade": results.grade,
            "strengths": results.top_strengths,
            "improvements": results.top_improvements,
        }
        for results, mode, difficulty in history[-10:]
    ]

    try:
        provider = get_ai_provider()
        prompt = build_overview_prompt(sessions_data, user.display_name or user.email)
        response_text = await provider._chat(prompt, max_tokens=512)  # type: ignore[attr-defined]
        data = json.loads(response_text.strip())
        ai_recommendation = data.get("ai_recommendation", "")
    except Exception:
        ai_recommendation = "Unable to generate personalised recommendation at this time."

    return OverviewResponse(
        total_sessions=len(history),
        average_score=round(sum(scores) / len(scores), 1),
        best_score=max(scores),
        worst_score=min(scores),
        most_common_strengths=[s for s, _ in Counter(all_strengths).most_common(3)],
        most_common_improvements=[s for s, _ in Counter(all_improvements).most_common(3)],
        ai_recommendation=ai_recommendation,
        sessions=sessions,
    )
