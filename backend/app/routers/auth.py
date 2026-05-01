from fastapi import APIRouter, Depends, HTTPException
from backend.app.pg_database.database import get_conn
from backend.app.pg_database.schemas import UserCreate, UserLogin
from backend.app.jwt_utils import create_access_token
from backend.app.utils import hash_password, validate_password
from uuid6 import uuid7
import asyncpg
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup")
async def signup(user: UserCreate, conn: asyncpg.Connection = Depends(get_conn)):
    existing = await conn.fetchrow(
        "SELECT id FROM users WHERE email = $1", user.email
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = uuid7()
    hashed = hash_password(user.password)

    await conn.execute(
        """INSERT INTO users (id, first_name, last_name, email, password)
           VALUES ($1, $2, $3, $4, $5)""",
        user_id, user.firstName, user.lastName, user.email, hashed
    )

    token = create_access_token(str(user_id))
    logger.info(f"User created: {user.email} ({user_id})")
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login")
async def login(user: UserLogin, conn: asyncpg.Connection = Depends(get_conn)):
    row = await conn.fetchrow(
        "SELECT id, password FROM users WHERE email = $1", user.email
    )
    if not row or not validate_password(user.password, row["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(row["id"]))
    logger.info(f"User logged in: {user.email}")
    return {"access_token": token, "token_type": "bearer"}