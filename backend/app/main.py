from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from backend.app.config import settings
from backend.app.pg_database.database import create_database_pool
from backend.app.routers import auth
from backend.app.routers import research
from backend.app.routers import kb

logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler()], force=True)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db_pool = await create_database_pool(settings.database_url)
    logger.info("Startup complete.")
    yield
    await app.state.db_pool.close()
    logger.info("Shutdown complete.")


app = FastAPI(title="ML Research Assistant", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(research.router)
app.include_router(kb.router)