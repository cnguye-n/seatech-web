import os
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")

def get_role(email: str) -> str:
    if not DATABASE_URL or not email:
        return "viewer"

    try:
        with psycopg2.connect(DATABASE_URL, connect_timeout=5) as conn:
            with conn.cursor() as cur:
                cur.execute("select role from public.users where email = %s", (email,))
                row = cur.fetchone()
                return row[0] if row and row[0] else "viewer"
    except psycopg2.OperationalError:
        # Network/connection problem (can't reach Supabase) — return safe default
        return "viewer"
    except psycopg2.Error:
        # Any other DB error, also fallback
        return "viewer"