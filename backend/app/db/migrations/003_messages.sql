CREATE TABLE messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id   UUID        NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_thread ON messages(thread_id);