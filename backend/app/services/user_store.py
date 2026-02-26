import bcrypt
from threading import Lock
from typing import Optional

from app.models.user import User, SessionSummary
from app.models.results import InterviewResults


class UserStore:
    """In-memory store for users and their interview history (no TTL — persists for process lifetime)."""

    def __init__(self):
        self._users_by_id: dict[str, User] = {}
        self._users_by_email: dict[str, str] = {}  # email -> user_id
        self._history: dict[str, list[InterviewResults]] = {}  # user_id -> results list
        self._lock = Lock()

    # ── Users ─────────────────────────────────────────────────────────────────

    def create_user(self, email: str, password: str, display_name: Optional[str] = None) -> User:
        with self._lock:
            if email in self._users_by_email:
                raise ValueError("Email already registered.")
            hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            user = User(email=email, hashed_password=hashed, display_name=display_name)
            self._users_by_id[user.user_id] = user
            self._users_by_email[email] = user.user_id
            return user

    def authenticate(self, email: str, password: str) -> Optional[User]:
        with self._lock:
            user_id = self._users_by_email.get(email)
            if not user_id:
                return None
            user = self._users_by_id[user_id]
        # bcrypt.checkpw is CPU-bound — check outside lock to avoid blocking
        if bcrypt.checkpw(password.encode(), user.hashed_password.encode()):
            return user
        return None

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        with self._lock:
            return self._users_by_id.get(user_id)

    # ── Interview History ─────────────────────────────────────────────────────

    def add_result(self, user_id: str, results: InterviewResults, mode: str, difficulty: str) -> None:
        with self._lock:
            if user_id not in self._history:
                self._history[user_id] = []
            # Attach mode/difficulty as extra metadata on the results (stored separately as summary)
            self._history[user_id].append(results)
            # We store mode/difficulty alongside using a parallel list trick:
            # store as tuple (results, mode, difficulty)
            # Replace the last entry with a tagged version
            self._history[user_id][-1] = (results, mode, difficulty)  # type: ignore[assignment]

    def get_history(self, user_id: str) -> list[tuple[InterviewResults, str, str]]:
        with self._lock:
            return list(self._history.get(user_id, []))  # type: ignore[return-value]

    def get_result_by_session(self, user_id: str, session_id: str) -> Optional[InterviewResults]:
        for results, _, _ in self.get_history(user_id):
            if results.session_id == session_id:
                return results
        return None


_store = UserStore()


def get_user_store() -> UserStore:
    return _store
