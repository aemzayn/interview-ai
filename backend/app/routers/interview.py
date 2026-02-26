import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response, Request

from app.models.interview import (
    InterviewSession,
    SessionStatus,
    StartInterviewRequest,
    StartInterviewResponse,
    RespondRequest,
    RespondResponse,
    EndInterviewRequest,
    Answer,
)
from app.services.session_store import get_session_store
from app.services.question_generator import generate_questions
from app.services.evaluator import evaluate_session
from app.auth.jwt_utils import get_optional_user_id

router = APIRouter()


@router.post("/start", response_model=StartInterviewResponse)
async def start_interview(req: StartInterviewRequest, request: Request):
    store = get_session_store()

    # Resolve CV profile from token
    cv_profile = store.get_cv_profile(req.cv_session_token)
    if cv_profile is None:
        raise HTTPException(status_code=404, detail="CV session token not found or expired.")

    # Generate questions
    try:
        questions = await generate_questions(
            cv_profile=cv_profile,
            mode=req.mode,
            difficulty=req.difficulty,
            count=req.question_count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {e}")

    if not questions:
        raise HTTPException(status_code=500, detail="No questions generated.")

    # Create session (link to user if authenticated)
    session = InterviewSession(
        cv_profile=cv_profile,
        mode=req.mode,
        difficulty=req.difficulty,
        questions=questions,
        user_id=get_optional_user_id(request),
    )
    store.store_session(session)

    first_question = questions[0]
    return StartInterviewResponse(
        session_id=session.session_id,
        question=first_question,
        question_number=1,
        total_questions=len(questions),
    )


@router.post("/respond", response_model=RespondResponse)
async def respond_to_question(req: RespondRequest):
    store = get_session_store()
    session = store.get_session(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found or expired.")
    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=409, detail=f"Session is not active (status: {session.status}).")

    # Record the answer
    answer = Answer(
        question_id=req.question_id,
        transcript=req.transcript,
        duration_seconds=req.duration_seconds,
    )
    session.answers.append(answer)
    session.current_question_index += 1

    # Determine next question
    next_index = session.current_question_index
    if next_index < len(session.questions):
        next_question = session.questions[next_index]
        store.update_session(session)
        return RespondResponse(
            next_question=next_question,
            question_number=next_index + 1,
            total_questions=len(session.questions),
            is_final=False,
        )
    else:
        session.status = SessionStatus.COMPLETED
        store.update_session(session)
        return RespondResponse(is_final=True, total_questions=len(session.questions))


@router.post("/end")
async def end_interview(req: EndInterviewRequest, background_tasks: BackgroundTasks):
    store = get_session_store()
    session = store.get_session(req.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found or expired.")

    if session.status not in (SessionStatus.ACTIVE, SessionStatus.COMPLETED):
        raise HTTPException(status_code=409, detail=f"Session already in status: {session.status}.")

    if not session.answers:
        raise HTTPException(status_code=400, detail="No answers recorded — cannot evaluate.")

    session.status = SessionStatus.EVALUATING
    store.update_session(session)

    background_tasks.add_task(_run_evaluation, session)
    return {"message": "Evaluation queued.", "session_id": session.session_id}


async def _run_evaluation(session: InterviewSession):
    store = get_session_store()
    try:
        await evaluate_session(session)
        session.status = SessionStatus.EVALUATED
    except Exception:
        session.status = SessionStatus.ERROR
    store.update_session(session)


@router.get("/{session_id}/results")
async def get_results(session_id: str, response: Response):
    store = get_session_store()
    session = store.get_session(session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    if session.status == SessionStatus.EVALUATING:
        response.status_code = 202
        return {"status": "evaluating", "session_id": session_id}

    if session.status == SessionStatus.ERROR:
        raise HTTPException(status_code=500, detail="Evaluation failed.")

    results = store.get_results(session_id)
    if results is None:
        response.status_code = 202
        return {"status": "evaluating", "session_id": session_id}

    return results
