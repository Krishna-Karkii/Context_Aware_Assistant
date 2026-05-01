import asyncpg
from uuid import UUID
from typing import Optional

async def create_space(
    conn: asyncpg.Connection,
    space_id: UUID,
    name: str,
    slug: str,
    owner_id: UUID,
    description: Optional[str] = None,
    is_private: bool = True
) -> asyncpg.Record:
    return await conn.fetchrow(
        """
        INSERT INTO spaces (id, name, slug, owner_id, description, is_private)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        """,
        space_id, name, slug, owner_id, description, is_private
    )


async def get_space_by_id(
    conn: asyncpg.Connection,
    space_id: UUID
) -> Optional[asyncpg.Record]:
    return await conn.fetchrow(
        "SELECT * FROM spaces WHERE id = $1",
        space_id
    )


async def get_space_by_slug(
    conn: asyncpg.Connection,
    slug: str
) -> Optional[asyncpg.Record]:
    return await conn.fetchrow(
        "SELECT * FROM spaces WHERE slug = $1",
        slug
    )


async def get_spaces_for_user(
    conn: asyncpg.Connection,
    user_id: UUID
) -> list[asyncpg.Record]:
    """All spaces a user is a member of, with their role."""
    return await conn.fetch(
        """
        SELECT s.*, sm.role, sm.joined_at
        FROM spaces s
        JOIN space_members sm ON sm.space_id = s.id
        WHERE sm.user_id = $1
        ORDER BY sm.joined_at DESC
        """,
        user_id
    )


async def update_space(
    conn: asyncpg.Connection,
    space_id: UUID,
    name: Optional[str] = None,
    description: Optional[str] = None,
    is_private: Optional[bool] = None
) -> Optional[asyncpg.Record]:
    return await conn.fetchrow(
        """
        UPDATE spaces
        SET
            name        = COALESCE($2, name),
            description = COALESCE($3, description),
            is_private  = COALESCE($4, is_private),
            updated_at  = NOW()
        WHERE id = $1
        RETURNING *
        """,
        space_id, name, description, is_private
    )


async def delete_space(
    conn: asyncpg.Connection,
    space_id: UUID
) -> None:
    await conn.execute(
        "DELETE FROM spaces WHERE id = $1",
        space_id
    )


async def slug_exists(
    conn: asyncpg.Connection,
    slug: str
) -> bool:
    row = await conn.fetchrow(
        "SELECT 1 FROM spaces WHERE slug = $1",
        slug
    )
    return row is not None

async def add_space_member(
    conn: asyncpg.Connection,
    member_id: UUID,
    space_id: UUID,
    user_id: UUID,
    role: str,
    invited_by: Optional[UUID] = None
) -> asyncpg.Record:
    return await conn.fetchrow(
        """
        INSERT INTO space_members (id, space_id, user_id, role, invited_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        """,
        member_id, space_id, user_id, role, invited_by
    )


async def get_space_member(
    conn: asyncpg.Connection,
    space_id: UUID,
    user_id: UUID
) -> Optional[asyncpg.Record]:
    return await conn.fetchrow(
        """
        SELECT sm.*, u.first_name, u.last_name, u.email, u.avatar_url
        FROM space_members sm
        JOIN users u ON u.id = sm.user_id
        WHERE sm.space_id = $1 AND sm.user_id = $2
        """,
        space_id, user_id
    )


async def get_space_members(
    conn: asyncpg.Connection,
    space_id: UUID
) -> list[asyncpg.Record]:
    return await conn.fetch(
        """
        SELECT sm.id, sm.role, sm.joined_at,
               u.id as user_id, u.first_name, u.last_name,
               u.email, u.avatar_url
        FROM space_members sm
        JOIN users u ON u.id = sm.user_id
        WHERE sm.space_id = $1
        ORDER BY sm.joined_at ASC
        """,
        space_id
    )


async def update_member_role(
    conn: asyncpg.Connection,
    space_id: UUID,
    user_id: UUID,
    new_role: str
) -> Optional[asyncpg.Record]:
    return await conn.fetchrow(
        """
        UPDATE space_members
        SET role = $3
        WHERE space_id = $1 AND user_id = $2
        RETURNING *
        """,
        space_id, user_id, new_role
    )


async def remove_space_member(
    conn: asyncpg.Connection,
    space_id: UUID,
    user_id: UUID
) -> None:
    await conn.execute(
        "DELETE FROM space_members WHERE space_id = $1 AND user_id = $2",
        space_id, user_id
    )


async def get_user_role_in_space(
    conn: asyncpg.Connection,
    space_id: UUID,
    user_id: UUID
) -> Optional[str]:
    row = await conn.fetchrow(
        "SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2",
        space_id, user_id
    )
    return row["role"] if row else None


async def create_invite(
    conn: asyncpg.Connection,
    invite_id: UUID,
    space_id: UUID,
    created_by: UUID,
    role: str,
    max_uses: Optional[int] = None,
    expires_at=None
) -> asyncpg.Record:
    return await conn.fetchrow(
        """
        INSERT INTO space_invites
            (id, space_id, created_by, role, max_uses, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        """,
        invite_id, space_id, created_by, role, max_uses, expires_at
    )


async def get_invite_by_token(
    conn: asyncpg.Connection,
    token: UUID
) -> Optional[asyncpg.Record]:
    return await conn.fetchrow(
        """
        SELECT i.*, s.name as space_name
        FROM space_invites i
        JOIN spaces s ON s.id = i.space_id
        WHERE i.token = $1
        """,
        token
    )


async def increment_invite_use(
    conn: asyncpg.Connection,
    invite_id: UUID
) -> None:
    await conn.execute(
        "UPDATE space_invites SET use_count = use_count + 1 WHERE id = $1",
        invite_id
    )