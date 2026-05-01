import asyncpg
from uuid import UUID
from typing import Optional


async def get_user_by_id(
    conn: asyncpg.Connection,
    user_id: UUID
) -> Optional[asyncpg.Record]:
    return await conn.fetchrow(
        """
        SELECT id, first_name, last_name, email, is_active,
               avatar_url, last_seen_at, created_at
        FROM users
        WHERE id = $1
        """,
        user_id
    )


async def get_user_by_email(
    conn: asyncpg.Connection,
    email: str
) -> Optional[asyncpg.Record]:
    return await conn.fetchrow(
        """
        SELECT id, first_name, last_name, email, password,
               is_active, created_at
        FROM users
        WHERE email = $1
        """,
        email
    )


async def create_user(
    conn: asyncpg.Connection,
    user_id: UUID,
    first_name: str,
    last_name: str,
    email: str,
    hashed_password: str
) -> asyncpg.Record:
    return await conn.fetchrow(
        """
        INSERT INTO users (id, first_name, last_name, email, password)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, first_name, last_name, email, created_at
        """,
        user_id, first_name, last_name, email, hashed_password
    )


async def update_last_seen(
    conn: asyncpg.Connection,
    user_id: UUID
) -> None:
    await conn.execute(
        "UPDATE users SET last_seen_at = NOW() WHERE id = $1",
        user_id
    )


async def update_user_profile(
    conn: asyncpg.Connection,
    user_id: UUID,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    avatar_url: Optional[str] = None
) -> Optional[asyncpg.Record]:
    return await conn.fetchrow(
        """
        UPDATE users
        SET
            first_name = COALESCE($2, first_name),
            last_name  = COALESCE($3, last_name),
            avatar_url = COALESCE($4, avatar_url),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, first_name, last_name, email, avatar_url, updated_at
        """,
        user_id, first_name, last_name, avatar_url
    )










