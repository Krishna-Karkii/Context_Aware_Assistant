import asyncio
import asyncpg
import glob
import os
import sys
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


async def run_migrations(dsn: str) -> None:
    conn = await asyncpg.connect(dsn)

    try:
        bootstrap = MIGRATIONS_DIR / "000_schema_migrations.sql"
        await conn.execute(bootstrap.read_text())

        ran: set[str] = {
            r["filename"]
            for r in await conn.fetch("SELECT filename FROM schema_migrations")
        }

        files = sorted(
            f for f in MIGRATIONS_DIR.glob("*.sql")
            if f.name != "000_schema_migrations.sql"
        )

        if not files:
            print("No migration files found.")
            return

        pending = [f for f in files if f.name not in ran]

        if not pending:
            print("✓ All migrations already applied.")
            return

        for filepath in pending:
            print(f"  → Running {filepath.name} ...", end="", flush=True)
            sql = filepath.read_text()

            async with conn.transaction():
                await conn.execute(sql)
                await conn.execute(
                    "INSERT INTO schema_migrations(filename) VALUES($1)",
                    filepath.name
                )

            print(" ✓")

        print(f"\n✓ Applied {len(pending)} migration(s).")

    finally:
        await conn.close()


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("Error: DATABASE_URL environment variable not set.", file=sys.stderr)
        sys.exit(1)

    asyncio.run(run_migrations(dsn))