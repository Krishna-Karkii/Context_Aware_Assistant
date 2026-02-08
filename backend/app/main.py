from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from contextlib import asynccontextmanager

import logging
from dotenv import load_dotenv
import os

from .pg_database.database import create_database_pool, initialize_database


load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler()],
    force=True
    )
logger = logging.getLogger(__name__)

DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@localhost/{os.getenv('DB_NAME')}"

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_pool = await create_database_pool(db_url=DATABASE_URL)
    logger.info("Created pool successfully, initializing database...")
    await initialize_database(app.state.db_pool)
    logger.info("Application Startup Complete.")
    yield
    await app.state.db_pool.close()


app = FastAPI(title="ML Research Assistant",
              version="1.0",
              lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)