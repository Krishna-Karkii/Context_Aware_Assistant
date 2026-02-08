import asyncpg
import os
from fastapi import Request
import logging

logger = logging.getLogger(__name__)

async def create_database_pool(db_url: str):
    """
    Creates a connection pool to reuse connections, imporoving performance and not exhausting database resources.
    """
    try:
        pool = await asyncpg.create_pool(
            dsn=db_url,
            min_size=5,
            max_size=20
        )
        logger.info("Database connection pool created successfully.")
        return pool
    except Exception as e:
        logger.error(f"Error connecting to the database: {e}")
        return None

async def initialize_database(conn: Request.app.state.db_pool):
    """
    Initializes the database by creating necessary tables if they do not exist.
    """
    try:
        async with conn.acquire() as connection:
            await connection.execute("""CREATE TABLE IF NOT EXISTS users(
                                    id UUID PRIMARY KEY,
                                    first_name TEXT NOT NULL,
                                    last_name TEXT NOT NULL,
                                    email TEXT UNIQUE NOT NULL,
                                    password TEXT NOT NULL);
                                    
                                    CREATE TABLE IF NOT EXISTS groups(
                                    id UUID PRIMARY KEY,
                                    name TEXT NOT NULL,
                                    DESCRIPTION TEXT NOT NULL);
                                    
                                    CREATE TABLE IF NOT EXISTS group_members(
                                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                                    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
                                    PRIMARY KEY (user_id, group_id)
                                    );""")
            logger.info("Database initialized successfully!")
    except Exception as e:
        logger.error(f"Error initializing the database: {e}")
        