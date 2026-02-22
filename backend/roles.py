# roles.py
import os
import psycopg2

def get_role(email: str) -> str:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return "public"

    # psycopg2 expects postgresql:// (NOT SQLAlchemy's postgresql+psycopg2://)
    if db_url.startswith("postgresql+psycopg2://"):
        db_url = db_url.replace("postgresql+psycopg2://", "postgresql://", 1)

    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("select role from public.users where email = %s", (email,))
            row = cur.fetchone()
            return row[0] if row else "public"
    finally:
        conn.close()