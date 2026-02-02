import os
from functools import wraps
from flask import request, jsonify, g

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

def _bearer_token():
    h = request.headers.get("Authorization", "")
    if not h.startswith("Bearer "):
        return None
    return h.split(" ", 1)[1].strip()

def verify_google():
    if not GOOGLE_CLIENT_ID:
        return None, (jsonify({"error": "GOOGLE_CLIENT_ID missing on server"}), 500)

    token = _bearer_token()
    if not token:
        return None, (jsonify({"error": "Missing Authorization Bearer token"}), 401)

    try:
        claims = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        email = claims.get("email")
        if not email:
            return None, (jsonify({"error": "Token missing email"}), 401)
        return claims, None
    except Exception:
        return None, (jsonify({"error": "Invalid or expired token"}), 401)

def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        claims, err = verify_google()
        if err:
            return err
        g.user_email = claims["email"]
        g.user_name = claims.get("name")
        g.user_picture = claims.get("picture")
        return fn(*args, **kwargs)
    return wrapper
