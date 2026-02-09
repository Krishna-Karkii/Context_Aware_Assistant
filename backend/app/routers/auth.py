from fastapi import APIRouter, Depends, HTTPException, Request

from backend.app.jwt_utils import create_access_token
from backend.app.pg_database.schemas import UserCreate, UserLogin
from logging import getLogger
from backend.app.utils import hash_password, validate_password
from uuid6 import uuid7


logger = getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

async def get_db(request: Request):
    """
    """
    return request.app.state.db_pool

@router.post("/signup")
async def signup(user: UserCreate, db=Depends(get_db)):
    """
    """
    try:
        async with db.acquire() as connection:
            existing_user = await connection.fetchrow("SELECT * FROM users WHERE email = $1", user.email)
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
            # Hashing the password
            hashed_password = hash_password(user.password)

            # Registering the user in the database
            user_id = uuid7()
            query = """INSERT INTO users (id, first_name, last_name, email, password) VALUES ($1, $2, $3, $4, $5)"""
            await connection.execute(query, user_id, user.firstName, user.lastName, user.email, hashed_password)

            logger.info(f"User {user.email} created succesfully with ID {user_id}")

            # Creating a JWT token
            access_token = create_access_token(data={"sub": str(user.email)})
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "message": "User Created Successfully."
            }
    except Exception as e:
        logger.error(f"Error during signup: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/login")
async def login(user: UserLogin, db = Depends(get_db)):
    """
    """
    try:
        async with db.acquire() as connection:
            existing_user = await connection.fetchrow("SELECT * FROM users WHERE email = $1", user.email)
            if not existing_user or not validate_password(user.password, existing_user['password']):
                raise HTTPException(status_code=400, detail="Invalid email or password")
            
            logger.info(f"User {user.email} logged in successfully.")

            # Creating a JWT token
            access_token = create_access_token(
                data={"sub": str(user.email)}
            )
            logger.info(f"Access token created for user {access_token} sucessfully. {type(access_token)}")
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "message": "Login Successful"
                }
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail=str(e))