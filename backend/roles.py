import os
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")

def get_role(email: str) -> str:
    # Default: not listed => viewer
    if not DATABASE_URL:
        return "viewer"

    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("select role from public.user_roles where email = %s", (email,))
            row = cur.fetchone()
            return row[0] if row else "viewer"
