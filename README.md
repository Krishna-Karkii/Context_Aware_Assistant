# 🔬 ML Research Assistant

A web-based assistant that lets you upload documents, ask natural-language questions, and receive accurate, citation-backed answers — all grounded in your own private knowledge base.

Built with **FastAPI**, **PostgreSQL + pgvector**, **React**, and **Ollama**.

---

## ✨ Features

- 📄 **Document Upload** — plain-text documents to your personal knowledge base
- 🧠 **Semantic Chunking** — Documents are split at natural meaning boundaries, not arbitrary character counts
- 🔍 **RAG Pipeline** — Retrieval-Augmented Generation grounds every answer in your uploaded documents
- 💡 **HyDE Retrieval** — Hypothetical Document Embedding improves search accuracy for complex questions
- 🎯 **MMR Re-ranking** — Maximal Marginal Relevance ensures retrieved context is relevant *and* diverse
- 💬 **Conversation History** — Multi-turn research conversations with full thread persistence
- 📎 **Source Citations** — Every answer references the exact documents it was drawn from
- 🔐 **JWT Authentication** — Secure login with Argon2 password hashing

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, FastAPI, asyncpg |
| Database | PostgreSQL 16 + pgvector |
| LLM & Embeddings | Ollama (llama3.2, nomic-embed-text) |
| Auth | JWT (python-jose), Argon2 (argon2-cffi) |

---

## 🧠 Retrieval Pipeline

Standard RAG returns the top-k most similar chunks — which are often redundant and miss complex questions. This project implements three custom algorithms on top of pgvector:

### 1. Semantic Chunking
Instead of splitting text documents at fixed character counts, the document is first split into sentences. Each sentence is embedded individually, and consecutive sentence pairs with a sharp drop in cosine similarity are treated as natural topic boundaries. This produces chunks that contain complete ideas rather than arbitrary text windows.

```
Document → Sentences → Embed each → Find similarity drops → Split at valleys → Chunks
```

### 2. HyDE (Hypothetical Document Embedding)
A user's question and actual document are phrased very differently, so embedding the raw question often misses the best chunks. HyDE asks the LLM to generate a short hypothetical answer first, then embeds *that* as the search vector. The hypothetical answer is never shown to the user — it only guides the retrieval.

```
Query → LLM generates hypothetical answer → Embed answer → pgvector search → Real chunks
```

### 3. MMR (Maximal Marginal Relevance)
pgvector is asked for a larger candidate pool (top 20). MMR then selects the final top-k by iteratively picking chunks that are both relevant to the query *and* different from already-selected chunks, controlled by a λ parameter.

```
Top-20 candidates → MMR scoring: λ × relevance − (1−λ) × redundancy → Top-5 diverse chunks
```

---

## ⚙️ Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 16 with [pgvector](https://github.com/pgvector/pgvector) extension
- [Ollama](https://ollama.com) running locally

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ml-research-assistant.git
cd ml-research-assistant
```

### 2. Set up PostgreSQL

```sql
CREATE DATABASE research_assistant;
\c research_assistant
CREATE EXTENSION vector;
```

Then run the migration:

```bash
python db/migrate.py
```

### 3. Pull Ollama models

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

### 4. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=your_host
DB_PORT=your_port
DB_NAME=your_db_name
JWT_SECRET=your_secret
```

Start the backend:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

### 5. Set up the frontend

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔌 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create a new account |
| POST | `/auth/login` | Login and receive JWT |
| POST | `/kb/upload` | Upload a document to knowledge base |
| GET | `/kb` | List your uploaded documents |
| DELETE | `/kb/{doc_id}` | Delete a document |
| POST | `/research/query` | Ask a question (RAG + MMR + HyDE) |
| GET | `/research/threads` | List your conversation threads |
| GET | `/research/threads/{id}` | Get a thread with full message history |

Interactive API docs available at `http://localhost:8000/docs` once the backend is running.

---

## 🗄️ Database Schema

```
users               — accounts, roles, hashed passwords
threads             — conversation sessions per user
messages            — individual turns (user / assistant)
kb_documents        — uploaded document metadata + status
document_chunks     — text chunks with vector embeddings (pgvector)
```

The `document_chunks.embedding` column uses the `vector` type from pgvector with an IVFFLAT index for fast cosine-similarity search.

---

## 🔮 Future Plans

- [ ] GraphRAG — knowledge graph over authors, topics, and citations for multi-hop reasoning
- [ ] Hybrid BM25 + vector search with Reciprocal Rank Fusion
- [ ] Cross-encoder re-ranking for higher precision
- [ ] Query expansion for broader retrieval coverage
- [ ] Support for DOCX, HTML, and Markdown document formats
- [ ] Group / multi-user research workspaces
- [ ] HNSW index for improved vector search scalability

---

## 👥 Authors

- **Krishna Karki**
- **Dipesh Shrestha**

*B.A. in Computer Application — Madan Bhandari Memorial College, Tribhuvan University*

---

## 📄 License

This project is for academic purposes under the B.A. in Computer Application program at Tribhuvan University.