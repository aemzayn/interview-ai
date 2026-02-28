import json
from typing import Optional

import asyncpg

from app.config import get_settings

_pool: Optional[asyncpg.Pool] = None


async def _set_codecs(conn: asyncpg.Connection) -> None:
    """Automatically encode/decode JSON and JSONB columns as Python dicts."""
    for pg_type in ("json", "jsonb"):
        await conn.set_type_codec(
            pg_type,
            encoder=json.dumps,
            decoder=json.loads,
            schema="pg_catalog",
            format="text",
        )


async def init_pool() -> asyncpg.Pool:
    global _pool
    settings = get_settings()
    _pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=2,
        max_size=10,
        init=_set_codecs,
    )
    return _pool


async def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database pool not initialised — call init_pool() first.")
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
