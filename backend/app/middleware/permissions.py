from fastapi import Depends, HTTPException
from uuid import UUID
from backend.app.middleware.auth import get_current_user
from backend.app.pg_database.database import get_conn
import asyncpg

def require_space_role(*allowed_roles: str):
    """
    Usage:
        @router.delete("/kb/{doc_id}")
        async def delete_doc(
            space_id: UUID,
            _=Depends(require_space_role("admin"))
        ):
    """
    async def checker(
        space_id: UUID,
        current_user: dict = Depends(get_current_user),
        conn: asyncpg.Connection = Depends(get_conn),
    ):
        row = await conn.fetchrow(
            """SELECT role FROM space_members
               WHERE space_id = $1 AND user_id = $2""",
            space_id, current_user["id"]
        )

        if not row:
            raise HTTPException(status_code=403, detail="Not a member of this space")

        if row["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Requires role: {' or '.join(allowed_roles)}. You have: {row['role']}"
            )

        return {"role": row["role"], "user": current_user}

    return checker