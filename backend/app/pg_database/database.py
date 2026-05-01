import asyncpg
import logging
from pgvector.asyncpg import register_vector
from fastapi import Request

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None


async def create_database_pool(database_url: str) -> asyncpg.Pool:
    global _pool

    async def init_connection(conn):
        await register_vector(conn)

    _pool = await asyncpg.create_pool(
        database_url,
        min_size=2,
        max_size=10,
        init=init_connection,
    )
    logger.info("Database pool created.")
    return _pool


def get_pool() -> asyncpg.Pool:
    """Return the global pool — for use in background tasks."""
    if _pool is None:
        raise RuntimeError("Database pool not initialised")
    return _pool


async def get_conn(request: Request):
    """FastAPI dependency — yields a single connection from the pool."""
    async with request.app.state.db_pool.acquire() as conn:
        yield conn
