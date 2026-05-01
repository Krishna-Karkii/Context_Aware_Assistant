
import logging
import asyncpg
import asyncio
from uuid import UUID
from typing import Optional
import re

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel

from backend.app.pg_database.database import get_conn
from backend.app.middleware.auth import get_current_user
from backend.app.llm.client import embed
from backend.app.routers.research import cosine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/kb", tags=["knowledge base"])

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100


class DocumentUpload(BaseModel):
    title:    str
    authors:  str
    year:     Optional[str] = None
    source:   Optional[str] = None
    url:      Optional[str] = None
    abstract: Optional[str] = None
    content:  str

def split_into_sentences(text: str) -> list[str]:
    """Basic sentence splitter."""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 10]


async def semantic_chunk_text(
    text: str,
    embed_fn,               # pass your embed() function
    threshold: float = 0.4, # similarity drop below this = new chunk
    min_chunk_chars: int = 100,
    max_sentences_per_chunk: int = 15,
) -> list[str]:
    """
    Split text at points where consecutive sentence similarity drops sharply.
    """
    sentences = split_into_sentences(text)
    if len(sentences) <= 2:
        return [text]  # too short to semantically chunk

    # Embed every sentence
    embeddings = []
    for sentence in sentences:
        vec = await embed_fn(sentence)
        embeddings.append(vec)

    # Compute similarity between each consecutive pair
    similarities = []
    for i in range(len(embeddings) - 1):
        sim = cosine(embeddings[i], embeddings[i + 1])
        similarities.append(sim)

    # Find split points where similarity drops below threshold
    split_points = set()
    for i, sim in enumerate(similarities):
        if sim < threshold:
            split_points.add(i + 1)  # split BEFORE sentence i+1

    # Also force split if a chunk gets too long
    current_count = 0
    for i in range(len(sentences)):
        current_count += 1
        if current_count >= max_sentences_per_chunk:
            split_points.add(i + 1)
            current_count = 0

    # Group sentences into chunks
    chunks = []
    current_chunk_sentences = []
    for i, sentence in enumerate(sentences):
        if i in split_points and current_chunk_sentences:
            chunk_text = " ".join(current_chunk_sentences)
            if len(chunk_text) >= min_chunk_chars:
                chunks.append(chunk_text)
            current_chunk_sentences = []
        current_chunk_sentences.append(sentence)

    # Don't forget the last chunk
    if current_chunk_sentences:
        chunk_text = " ".join(current_chunk_sentences)
        if len(chunk_text) >= min_chunk_chars:
            chunks.append(chunk_text)

    return chunks


async def embed_and_store_chunks(
    conn: asyncpg.Connection,
    document_id: UUID,
    content: str,
):
    """Chunk the document, embed each chunk, store in document_chunks."""
    chunks = await semantic_chunk_text(content, embed_fn=embed)
    logger.info(f"[kb] Embedding {len(chunks)} chunks for doc {document_id}")

    for i, chunk in enumerate(chunks):
        try:
            vector = await embed(chunk)

            await conn.execute(
                """
                INSERT INTO document_chunks (document_id, chunk_index, content, embedding)
                VALUES ($1, $2, $3, $4::vector)
                """,
                document_id, i, chunk, vector
            )
        except Exception as e:
            logger.error(f"[kb] Failed to embed chunk {i}: {e}")
            continue

    # Mark document as indexed
    await conn.execute(
        "UPDATE kb_documents SET status = 'indexed' WHERE id = $1",
        document_id
    )
    logger.info(f"[kb] Document {document_id} indexed with {len(chunks)} chunks")

@router.post("/upload", status_code=201)
async def upload_document(
    body: DocumentUpload,
    background_tasks: BackgroundTasks,
    conn: asyncpg.Connection = Depends(get_conn),
    current_user: dict = Depends(get_current_user),
):
    # Store document metadata
    doc = await conn.fetchrow(
        """
        INSERT INTO kb_documents (user_id, title, authors, year, source, url, abstract, content, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'processing')
        RETURNING *
        """,
        current_user["id"],
        body.title,
        body.authors,
        body.year,
        body.source,
        body.url,
        body.abstract,
        body.content,
    )

    background_tasks.add_task(
        embed_and_store_chunks_bg,
        str(doc["id"]),
        body.content,
    )

    return {
        "id":      str(doc["id"]),
        "title":   doc["title"],
        "status":  "processing",
        "message": "Document received. Embedding in background.",
    }


async def embed_and_store_chunks_bg(document_id_str: str, content: str):
    """Background task wrapper — creates its own DB connection."""
    from backend.app.pg_database.database import get_pool
    pool = get_pool()
    async with pool.acquire() as conn:
        await embed_and_store_chunks(conn, UUID(document_id_str), content)


@router.get("")
async def list_documents(
    conn: asyncpg.Connection = Depends(get_conn),
    current_user: dict = Depends(get_current_user),
):
    docs = await conn.fetch(
        """
        SELECT id, title, authors, year, source, url, abstract, status, created_at,
               (SELECT COUNT(*) FROM document_chunks WHERE document_id = kb_documents.id) AS chunk_count
        FROM kb_documents
        WHERE user_id = $1
        ORDER BY created_at DESC
        """,
        current_user["id"]
    )
    return [dict(d) for d in docs]


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: UUID,
    conn: asyncpg.Connection = Depends(get_conn),
    current_user: dict = Depends(get_current_user),
):
    doc = await conn.fetchrow(
        "SELECT id, user_id FROM kb_documents WHERE id = $1",
        doc_id
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your document")

    # CASCADE deletes chunks too
    await conn.execute("DELETE FROM kb_documents WHERE id = $1", doc_id)














