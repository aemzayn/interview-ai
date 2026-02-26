import time
import uuid
from typing import Optional
from threading import Lock

from app.models.cv import CVProfile
from app.models.interview import InterviewSession
from app.models.results import InterviewResults
from app.config import get_settings


class SessionStore:
    """Thread-safe in-memory store with TTL for CV tokens and interview sessions."""

    def __init__(self):
        settings = get_settings()
        self._cv_ttl = settings.cv_session_ttl_seconds
        self._session_ttl = settings.interview_session_ttl_seconds
        self._cv_store: dict[str, tuple[CVProfile, float]] = {}  # token -> (profile, expiry)
        self._session_store: dict[str, tuple[InterviewSession, float]] = {}
        self._results_store: dict[str, InterviewResults] = {}
        self._lock = Lock()

    # ── CV Token ──────────────────────────────────────────────────────────────

    def store_cv_profile(self, profile: CVProfile) -> str:
        token = str(uuid.uuid4())
        expiry = time.time() + self._cv_ttl
        with self._lock:
            self._cv_store[token] = (profile, expiry)
        return token

    def get_cv_profile(self, token: str) -> Optional[CVProfile]:
        with self._lock:
            entry = self._cv_store.get(token)
            if entry is None:
                return None
            profile, expiry = entry
            if time.time() > expiry:
                del self._cv_store[token]
                return None
            return profile

    # ── Interview Sessions ────────────────────────────────────────────────────

    def store_session(self, session: InterviewSession) -> None:
        expiry = time.time() + self._session_ttl
        with self._lock:
            self._session_store[session.session_id] = (session, expiry)

    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        with self._lock:
            entry = self._session_store.get(session_id)
            if entry is None:
                return None
            session, expiry = entry
            if time.time() > expiry:
                del self._session_store[session_id]
                return None
            return session

    def update_session(self, session: InterviewSession) -> None:
        """Re-store a session (preserves original expiry is not tracked here; reset TTL)."""
        self.store_session(session)

    # ── Results ───────────────────────────────────────────────────────────────

    def store_results(self, session_id: str, results: InterviewResults) -> None:
        with self._lock:
            self._results_store[session_id] = results

    def get_results(self, session_id: str) -> Optional[InterviewResults]:
        with self._lock:
            return self._results_store.get(session_id)


# Singleton
_store = SessionStore()


def get_session_store() -> SessionStore:
    return _store
