from app.db.connection import get_pool

_CREATE_TABLES = """
CREATE TABLE IF NOT EXISTS users (
    user_id         TEXT PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    hashed_password TEXT,
    google_id       TEXT UNIQUE,
    display_name    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cv_sessions (
    token       TEXT PRIMARY KEY,
    cv_profile  JSONB NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cv_sessions_expires
    ON cv_sessions (expires_at);

CREATE TABLE IF NOT EXISTS interview_sessions (
    session_id  TEXT PRIMARY KEY,
    data        JSONB NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_expires
    ON interview_sessions (expires_at);

CREATE TABLE IF NOT EXISTS interview_results (
    session_id  TEXT PRIMARY KEY,
    data        JSONB NOT NULL,
    user_id     TEXT REFERENCES users(user_id) ON DELETE SET NULL,
    mode        TEXT,
    difficulty  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interview_results_user
    ON interview_results (user_id, created_at DESC);
"""

# Migrations for databases created before Google OAuth support
_MIGRATIONS = """
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;
"""


async def init_db() -> None:
    """Create all tables/indexes and apply column migrations idempotently."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(_CREATE_TABLES)
        await conn.execute(_MIGRATIONS)
