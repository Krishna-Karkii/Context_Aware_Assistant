CREATE TABLE IF NOT EXISTS schema_migrations (
    filename    VARCHAR(255)    PRIMARY KEY,
    ran_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE schema_migrations IS 'Tracks applied migration files, Managed by db/migrate.py.';