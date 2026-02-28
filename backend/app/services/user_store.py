import asyncio
import uuid
from typing import Optional

import bcrypt

from app.models.user import User
from app.models.results import InterviewResults
from app.db.connection import get_pool


class UserStore:
    """PostgreSQL-backed store for users and interview history."""

    async def create_user(
        self, email: str, password: str, display_name: Optional[str] = None
    ) -> User:
        user_id = str(uuid.uuid4())
        # bcrypt is CPU-bound — run in thread pool to avoid blocking the event loop
        hashed = await asyncio.to_thread(
            lambda: bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        )
        pool = await get_pool()
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO users (user_id, email, hashed_password, display_name)
                    VALUES ($1, $2, $3, $4)
                    """,
                    user_id,
                    email,
                    hashed,
                    display_name,
                )
        except Exception as exc:
            if "unique" in str(exc).lower():
                raise ValueError("Email already registered.")
            raise
        return User(
            user_id=user_id,
            email=email,
            hashed_password=hashed,
            display_name=display_name,
        )

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT user_id, email, hashed_password, display_name, created_at "
                "FROM users WHERE email = $1",
                email,
            )
        if row is None or row["hashed_password"] is None:
            # Unknown email, or Google-only account with no password set
            return None
        ok = await asyncio.to_thread(
            bcrypt.checkpw, password.encode(), row["hashed_password"].encode()
        )
        if not ok:
            return None
        return User(
            user_id=row["user_id"],
            email=row["email"],
            hashed_password=row["hashed_password"],
            display_name=row["display_name"],
            created_at=row["created_at"],
        )

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT user_id, email, hashed_password, display_name, created_at "
                "FROM users WHERE user_id = $1",
                user_id,
            )
        if row is None:
            return None
        return User(
            user_id=row["user_id"],
            email=row["email"],
            hashed_password=row["hashed_password"],
            display_name=row["display_name"],
            created_at=row["created_at"],
        )

    async def find_or_create_google_user(
        self, google_id: str, email: str, display_name: Optional[str] = None
    ) -> User:
        """Find an existing user by google_id or email, or create a new one."""
        pool = await get_pool()
        async with pool.acquire() as conn:
            # 1. Find by google_id (returning visitor)
            row = await conn.fetchrow(
                "SELECT user_id, email, hashed_password, display_name, created_at "
                "FROM users WHERE google_id = $1",
                google_id,
            )
            if row:
                return User(
                    user_id=row["user_id"],
                    email=row["email"],
                    hashed_password=row["hashed_password"],
                    display_name=row["display_name"],
                    created_at=row["created_at"],
                )

            # 2. Find by email — link Google to an existing email/password account
            row = await conn.fetchrow(
                "SELECT user_id, email, hashed_password, display_name, created_at "
                "FROM users WHERE email = $1",
                email,
            )
            if row:
                await conn.execute(
                    "UPDATE users SET google_id = $1 WHERE user_id = $2",
                    google_id,
                    row["user_id"],
                )
                return User(
                    user_id=row["user_id"],
                    email=row["email"],
                    hashed_password=row["hashed_password"],
                    display_name=row["display_name"],
                    created_at=row["created_at"],
                )

            # 3. New user — create without a password
            user_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO users (user_id, email, google_id, display_name) "
                "VALUES ($1, $2, $3, $4)",
                user_id,
                email,
                google_id,
                display_name,
            )
            return User(user_id=user_id, email=email, display_name=display_name)

    async def get_history(self, user_id: str) -> list[tuple[InterviewResults, str, str]]:
        """Return all results for a user, oldest first."""
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT data, mode, difficulty FROM interview_results "
                "WHERE user_id = $1 ORDER BY created_at ASC",
                user_id,
            )
        return [
            (
                InterviewResults.model_validate(row["data"]),
                row["mode"] or "",
                row["difficulty"] or "",
            )
            for row in rows
        ]


_store = UserStore()


def get_user_store() -> UserStore:
    return _store
