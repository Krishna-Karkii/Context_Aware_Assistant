# backend/app/jwt_utils.py
import datetime
from jose import jwt, JWTError
from typing import Optional
from backend.app.config import settings   # ← use config, drop dotenv

ALGORITHM = "HS256"

def create_access_token(user_id: str) -> str:
    expire = datetime.datetime.now(datetime.UTC) + datetime.timedelta(
        minutes=settings.jwt_expire_minutes
    )
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)

def verify_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        return None

def extract_token_from_header(authorization: str) -> Optional[str]:
    try:
        scheme, token = authorization.split()
        return token if scheme.lower() == "bearer" else None
    except ValueError:
        return None