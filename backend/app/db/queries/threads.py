async def create_thread(conn, user_id, title=None):
    return await conn.fetchrow(
        """
        INSERT INTO threads (user_id, title)
        VALUES ($1, $2)
        RETURNING *
        """,
        user_id, title
    )

async def get_thread(conn, thread_id):
    return await conn.fetchrow(
        "SELECT * FROM threads WHERE id = $1", thread_id
    )

async def get_threads_for_user(conn, user_id):
    return await conn.fetch(
        """
        SELECT * FROM threads 
        WHERE user_id = $1 
        ORDER BY created_at DESC
        """,
        user_id
    )

async def insert_message(conn, thread_id, user_id, role, content):
    return await conn.fetchrow(
        """
        INSERT INTO messages (thread_id, user_id, role, content)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        """,
        thread_id, user_id, role, content
    )

async def get_messages(conn, thread_id):
    return await conn.fetch(
        """
        SELECT * FROM messages 
        WHERE thread_id = $1 
        ORDER BY created_at ASC
        """,
        thread_id
    )