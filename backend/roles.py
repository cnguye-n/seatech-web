import os
import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")

def get_role(email: str) -> str:
    if not DATABASE_URL or not email:
        return "viewer"

    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute("select role from public.users where email = %s", (email,))
                row = cur.fetchone()
                return row[0] if row and row[0] else "viewer"
    except psycopg2.Error:
        return "viewer"