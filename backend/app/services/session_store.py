import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.models.cv import CVProfile
from app.models.interview import InterviewSession
from app.models.results import InterviewResults
from app.config import get_settings
from app.db.connection import get_pool


class SessionStore:
    """PostgreSQL-backed store for CV tokens, interview sessions, and results."""

    # ── CV Tokens ─────────────────────────────────────────────────────────────

    async def store_cv_profile(self, profile: CVProfile) -> str:
        settings = get_settings()
        token = str(uuid.uuid4())
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.cv_session_ttl_seconds)
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO cv_sessions (token, cv_profile, expires_at) VALUES ($1, $2, $3)",
                token,
                profile.model_dump(mode="json"),
                expires_at,
            )
        return token

    async def get_cv_profile(self, token: str) -> Optional[CVProfile]:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT cv_profile FROM cv_sessions WHERE token = $1 AND expires_at > NOW()",
                token,
            )
        if row is None:
            return None
        return CVProfile.model_validate(row["cv_profile"])

    # ── Interview Sessions ────────────────────────────────────────────────────

    async def store_session(self, session: InterviewSession) -> None:
        settings = get_settings()
        expires_at = datetime.now(timezone.utc) + timedelta(
            seconds=settings.interview_session_ttl_seconds
        )
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO interview_sessions (session_id, data, expires_at) VALUES ($1, $2, $3)",
                session.session_id,
                session.model_dump(mode="json"),
                expires_at,
            )

    async def get_session(self, session_id: str) -> Optional[InterviewSession]:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT data FROM interview_sessions WHERE session_id = $1 AND expires_at > NOW()",
                session_id,
            )
        if row is None:
            return None
        return InterviewSession.model_validate(row["data"])

    async def update_session(self, session: InterviewSession) -> None:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE interview_sessions SET data = $1 WHERE session_id = $2",
                session.model_dump(mode="json"),
                session.session_id,
            )

    # ── Results ───────────────────────────────────────────────────────────────

    async def store_results(
        self,
        session_id: str,
        results: InterviewResults,
        user_id: Optional[str] = None,
        mode: Optional[str] = None,
        difficulty: Optional[str] = None,
    ) -> None:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO interview_results (session_id, data, user_id, mode, difficulty)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (session_id) DO UPDATE SET data = EXCLUDED.data
                """,
                session_id,
                results.model_dump(mode="json"),
                user_id,
                mode,
                difficulty,
            )

    async def get_results(self, session_id: str) -> Optional[InterviewResults]:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT data FROM interview_results WHERE session_id = $1",
                session_id,
            )
        if row is None:
            return None
        return InterviewResults.model_validate(row["data"])


_store = SessionStore()


def get_session_store() -> SessionStore:
    return _store
