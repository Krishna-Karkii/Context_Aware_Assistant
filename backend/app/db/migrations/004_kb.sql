CREATE TABLE kb_documents (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(500) NOT NULL,
    authors     VARCHAR(500),
    year        VARCHAR(10),
    source      VARCHAR(200),
    url         TEXT,
    abstract    TEXT,
    content     TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','indexed','failed')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE document_chunks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID        NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER     NOT NULL,
    content     TEXT        NOT NULL,
    embedding   vector(768),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_chunks_embedding ON document_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);