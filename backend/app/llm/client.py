import httpx
import json
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = "http://localhost:11434"
CHAT_MODEL      = "llama3.2:3b"
EMBED_MODEL     = "nomic-embed-text"

SYSTEM_PROMPT = """You are a helpful research assistant.
Answer questions based on the provided context. Be concise, accurate, 
and cite sources when relevant. If you don't know something, say so clearly."""


async def chat(
    messages: list[dict],
    model: str = CHAT_MODEL,
) -> str:
    """
    Send a list of messages to Ollama and return the response text.

    messages format:
        [
            {"role": "system",    "content": "..."},
            {"role": "user",      "content": "..."},
            {"role": "assistant", "content": "..."},
            {"role": "user",      "content": "..."},
        ]
    """
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model":    model,
                "messages": messages,
                "stream":   False,
                "options": {
                    "num_ctx": 8192,       
                    "temperature": 0.7,
                    }
            }
        )
        response.raise_for_status()
        data = response.json()
        logger.info(f"[ollama] Raw response keys: {list(data.keys())}")
        return data["message"]["content"]


async def embed(text: str, model: str = EMBED_MODEL) -> list[float]:
    """
    Generate an embedding vector for a text string.
    Returns a 768-dim float list (nomic-embed-text).
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": model, "prompt": text}
        )
        response.raise_for_status()
        return response.json()["embedding"]


async def is_ollama_running() -> bool:
    """Health check — returns True if Ollama is reachable."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return r.status_code == 200
    except Exception:
        return False


def build_messages(
    history: list[dict],
    new_query: str,
) -> list[dict]:
    """
    Build the full message list for the LLM.

    history: list of {"role": "user"|"assistant", "content": "..."}
             from get_recent_messages_for_context() — newest first,
             so we reverse it here.

    Returns messages with system prompt prepended.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for msg in reversed(history):
        messages.append({
            "role":    msg["role"],
            "content": msg["content"],
        })

    messages.append({"role": "user", "content": new_query})

    return messages