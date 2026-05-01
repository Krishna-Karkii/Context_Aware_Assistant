
import logging
import asyncpg
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.app.pg_database.database import get_conn
from backend.app.middleware.auth import get_current_user
from backend.app.llm.client import chat, embed, is_ollama_running

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/research", tags=["research"])



TOP_K = 1

async def create_thread(conn, user_id, title=None):
    return await conn.fetchrow(
        "INSERT INTO threads (user_id, title) VALUES ($1, $2) RETURNING *",
        user_id, title
    )


async def get_thread(conn, thread_id):
    return await conn.fetchrow(
        "SELECT * FROM threads WHERE id = $1", thread_id
    )


async def get_threads_for_user(conn, user_id):
    return await conn.fetch(
        "SELECT id, title, created_at FROM threads WHERE user_id = $1 ORDER BY created_at DESC",
        user_id
    )


async def insert_message(conn, thread_id, user_id, role, content):
    return await conn.fetchrow(
        "INSERT INTO messages (thread_id, user_id, role, content) VALUES ($1, $2, $3, $4) RETURNING *",
        thread_id, user_id, role, content
    )


async def get_messages(conn, thread_id):
    return await conn.fetch(
        "SELECT role, content, created_at FROM messages WHERE thread_id = $1 ORDER BY created_at ASC",
        thread_id
    )


async def search_kb(conn, query_embedding: list[float], user_id: UUID, top_k: int = TOP_K):
    """
    Cosine similarity search over document_chunks.
    Only searches documents belonging to this user.
    Returns top_k chunks with their source document metadata.
    """
    results = await conn.fetch(
        """
        SELECT
            dc.content      AS chunk_content,
            dc.chunk_index,
            d.id            AS doc_id,
            d.title,
            d.authors,
            d.year,
            d.source,
            d.url,
            dc.embedding  AS embedding,
            1 - (dc.embedding <=> $1::vector) AS similarity
        FROM document_chunks dc
        JOIN kb_documents d ON d.id = dc.document_id
        WHERE d.user_id = $2
          AND d.status  = 'indexed'
          AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> $1::vector
        LIMIT $3
        """,
        query_embedding, user_id, top_k
    )
    return results

SYSTEM_PROMPT = """You are a helpful research assistant. 
Answer questions based on the provided context from the user's knowledge base.
Cite sources by referencing their title in brackets like [Title of Document].
If the context contains the answer, use it. If not, say so clearly and answer 
from your general knowledge. Be concise and accurate."""


def build_messages(history: list, new_query: str, context_chunks: list) -> list[dict]:
    """Build the full message list for the LLM with RAG context injected."""

    # Build context block from retrieved chunks
    if context_chunks:
        context_parts = []
        for chunk in context_chunks:
            source = f"{chunk['title']}"
            if chunk['authors']:
                source += f" — {chunk['authors']}"
            if chunk['year']:
                source += f" ({chunk['year']})"
            context_parts.append(f"[{source}]\n{chunk['chunk_content']}")
        context_text = "\n\n---\n\n".join(context_parts)
        system = SYSTEM_PROMPT + f"\n\n## Context from Knowledge Base\n\n{context_text}"
    else:
        system = SYSTEM_PROMPT + "\n\n(No documents in knowledge base yet — answering from general knowledge.)"

    messages = [{"role": "system", "content": system}]

    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": new_query})
    return messages


def extract_citations(context_chunks: list) -> list[dict]:
    """Build citation list from retrieved chunks — deduplicated by doc_id."""
    seen = set()
    citations = []
    for chunk in context_chunks:
        doc_id = str(chunk["doc_id"])
        if doc_id not in seen:
            seen.add(doc_id)
            citations.append({
                "id":      doc_id,
                "title":   chunk["title"],
                "authors": chunk["authors"] or "",
                "year":    chunk["year"] or "",
                "source":  chunk["source"] or "",
                "url":     chunk["url"] or "",
            })
    return citations


class QueryRequest(BaseModel):
    query:     str
    thread_id: Optional[UUID] = None


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x ** 2 for x in a) ** 0.5
    norm_b = sum(x ** 2 for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def mmr_select(candidates, query_vector, k=5, lambda_=0.7):
    """
    candidates: list of asyncpg Records from search_kb
                each record has 'chunk_content' and 'similarity'
                — but we need the raw embedding too, so we need
                  to add it to search_kb (see note below)
    """
    selected = []
    remaining = list(candidates)

    while len(selected) < k and remaining:
        best_score = -999
        best_candidate = None

        for candidate in remaining:
            # relevance to query (already computed by pgvector)
            relevance = candidate["similarity"]

            # max similarity to already selected chunks
            if selected:
                max_redundancy = max(
                    cosine(candidate["embedding"], s["embedding"])
                    for s in selected
                )
            else:
                max_redundancy = 0.0

            score = lambda_ * relevance - (1 - lambda_) * max_redundancy

            if score > best_score:
                best_score = score
                best_candidate = candidate

        selected.append(best_candidate)
        remaining.remove(best_candidate)

    return selected

@router.post("/query")
async def query(
    body: QueryRequest,
    conn: asyncpg.Connection = Depends(get_conn),
    current_user: dict = Depends(get_current_user),
):
    if not await is_ollama_running():
        raise HTTPException(status_code=503, detail="Ollama not running. Run: ollama serve")

    if body.thread_id:
        thread = await get_thread(conn, body.thread_id)
        if not thread:
            raise HTTPException(status_code=404, detail="Thread not found")
        if thread["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not your thread")
        thread_id = body.thread_id
    else:
        thread = await create_thread(conn, user_id=current_user["id"], title=body.query[:80])
        thread_id = thread["id"]
        logger.info(f"[research] Created thread {thread_id}")

    history = await get_messages(conn, thread_id)
    logger.info(f"[research] {len(history)} messages in history")

    citations = []
    context_chunks = []
    try:
        try:
            hyde_messages = [
                {"role": "system", "content": (
                    "Write a short paragraph that would directly answer the following question," 
                    "as if it were an excerpt from a relevant document on the topic."
                )},
                {"role": "user", "content": body.query}
            ]
            hypothetical_answer = await chat(hyde_messages)
            query_vector = await embed(hypothetical_answer)
            logger.info(f"[research] HyDE: generated hypothetical answer for embedding")
        except Exception as e:
            logger.warning(f"[research] HyDE failed, falling back to direct query embedding: {e}")
            query_vector = await embed(body.query)
        candidates = await search_kb(conn, query_vector, current_user["id"], top_k=20)
        context_chunks = mmr_select(candidates, query_vector, k=1, lambda_=0.7)
        citations = extract_citations(context_chunks)
        logger.info(f"[research] Found {len(context_chunks)} relevant chunks from {len(citations)} documents")
    except Exception as e:
        logger.warning(f"[research] KB search failed (continuing without context): {e}")

    messages = build_messages(list(history), body.query, context_chunks)

    try:
        response_text = await chat(messages)
    except Exception as e:
        logger.error(f"[research] Ollama error: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"LLM error: {type(e).__name__}: {str(e)}")

    async with conn.transaction():
        await insert_message(conn, thread_id, current_user["id"], "user",      body.query)
        assistant_msg = await insert_message(conn, thread_id, None, "assistant", response_text)

    return {
        "response":   response_text,
        "thread_id":  str(thread_id),
        "message_id": str(assistant_msg["id"]),
        "citations":  citations,
    }


@router.get("/threads")
async def list_threads(
    conn: asyncpg.Connection = Depends(get_conn),
    current_user: dict = Depends(get_current_user),
):
    threads = await get_threads_for_user(conn, current_user["id"])
    return [dict(t) for t in threads]


@router.get("/threads/{thread_id}")
async def get_thread_with_messages(
    thread_id: UUID,
    conn: asyncpg.Connection = Depends(get_conn),
    current_user: dict = Depends(get_current_user),
):
    thread = await get_thread(conn, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    if thread["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your thread")

    messages = await get_messages(conn, thread_id)
    return {
        **dict(thread),
        "messages": [dict(m) for m in messages],
    }