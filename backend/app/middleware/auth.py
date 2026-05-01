from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.jwt_utils import verify_token
from backend.app.pg_database.database import get_conn
import asyncpg

bearer_scheme = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    conn: asyncpg.Connection = Depends(get_conn),
) -> dict:
    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user = await conn.fetchrow(
        "SELECT id, first_name, last_name, email, is_active FROM users WHERE id = $1",
        user_id
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Account deactivated")

    return dict(user)