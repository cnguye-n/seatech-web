import os
import re
import requests
from functools import wraps
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, redirect, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

# Env / App setup
# -----------------------
load_dotenv()
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
print("DATABASE_URL =", os.getenv("DATABASE_URL"))

FRONTEND_DEV = "http://localhost:5173"


app = Flask(__name__)
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "https://seatech-web.vercel.app",
        re.compile(r"^https://.*\.vercel\.app$"),
    ],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
)

@app.before_request
def handle_preflight():
    # Let CORS preflight requests through without auth checks
    if request.method == "OPTIONS":
        return ("", 204)
    
# Config
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")

# Database
# -----------------------
db_url = os.getenv("DATABASE_URL")  # put this in backend/.env
if not db_url:
    raise RuntimeError("DATABASE_URL not set. Add it to backend/.env")

# SQLAlchemy commonly wants this prefix
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# example model using plain lat/lon (no PostGIS needed)
class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print("db.create_all failed:", e)
        
# Auth + Role helpers (Bearer Google id_token)
# -----------------------       
def get_user_from_request():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, (jsonify({"error": "Missing or invalid Authorization header"}), 401)

    token = auth.split(" ", 1)[1].strip()
    r = requests.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": token})
    if r.status_code != 200:
        return None, (jsonify({"error": "Invalid token"}), 401)

    payload = r.json()
    email = payload.get("email", "")
    name = payload.get("name") or payload.get("given_name") or email
    picture = payload.get("picture")

    # ensure user exists + fetch role
    q = text("""
        insert into public.users (email, name, picture, last_login)
        values (:email, :name, :picture, now())
        on conflict (email) do update
        set name = excluded.name,
            picture = excluded.picture,
            last_login = now()
        returning email, name, picture, role;
    """)
    with db.engine.begin() as conn:
        row = conn.execute(q, {"email": email, "name": name, "picture": picture}).fetchone()

    return {"email": row.email, "name": row.name, "picture": row.picture, "role": row.role}, None


def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user, err = get_user_from_request()
        if err:
            return err
        g.user = user
        return f(*args, **kwargs)
    return wrapper


def require_admin(f):
    @wraps(f)
    @require_auth
    def wrapper(*args, **kwargs):
        if g.user.get("role") != "admin":
            return jsonify({"error": "Forbidden"}), 403
        return f(*args, **kwargs)
    return wrapper


# Admin Routes
# -----------------------
@app.get("/api/admin/users")
@require_admin
def admin_list_users():
    q = text("""
        select email, name, picture, role, last_login, created_at
        from public.users
        order by created_at desc;
    """)
    with db.engine.connect() as conn:
        rows = conn.execute(q).fetchall()

    return jsonify([
        {
            "email": r.email,
            "name": r.name,
            "picture": r.picture,
            "role": r.role,
            "last_login": r.last_login.isoformat() if r.last_login else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]), 200


@app.patch("/api/admin/users/<path:email>/role")
@require_admin
def admin_update_user_role(email):
    body = request.get_json() or {}
    new_role = body.get("role")

    allowed = {"public", "member", "admin"}
    if new_role not in allowed:
        return jsonify({"error": "Invalid role"}), 400

    # safety: don’t let admin remove their own admin
    if email == g.user["email"] and new_role != "admin":
        return jsonify({"error": "You cannot remove your own admin role."}), 400

    q = text("""
        update public.users
        set role = :role
        where email = :email
        returning email, role;
    """)

    with db.engine.begin() as conn:
        row = conn.execute(q, {"email": email, "role": new_role}).fetchone()

    if not row:
        return jsonify({"error": "User not found (they must login at least once)."}), 404

    return jsonify({"email": row.email, "role": row.role}), 200


# Base / Utility Routes
# -----------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/", methods=["GET"])
def root():
    return redirect("https://seatech-web.vercel.app", code=302)

@app.get("/api/me")
@require_auth
def me():
    return jsonify(g.user), 200

# Locations Routes 
# -----------------------
@app.route("/api/locations", methods=["GET"])
def list_locations():
    rows = Location.query.all()
    out = []
    for r in rows:
        out.append({
            "id": r.id,
            "name": r.name,
            "latitude": r.latitude,
            "longitude": r.longitude,
        })
    return jsonify(out)

@app.route("/api/locations", methods=["POST"])
def add_location():
    data = request.get_json()
    name = data["name"]
    lon  = float(data["lon"])
    lat  = float(data["lat"])

    loc = Location(name=name, latitude=lat, longitude=lon)
    db.session.add(loc)
    db.session.commit()
    return jsonify({"ok": True, "id": loc.id}), 201


# Debug/Data Routes
# -----------------------
@app.route("/api/pings", methods=["GET"])
def get_pings():
    query = text("""
        SELECT id, tag_id, ping_time, latitude, longitude
        FROM pings
        ORDER BY ping_time
        LIMIT 20;
    """)
    with db.engine.connect() as conn:
        result = conn.execute(query)
        rows = [
            {
                "id": r.id,
                "tag_id": r.tag_id,
                "ping_time": r.ping_time.isoformat(),
                "latitude": r.latitude,
                "longitude": r.longitude,
            }
            for r in result
        ]
    return jsonify(rows), 200

# Route for turtle path
@app.route("/api/turtles/<int:turtle_id>/path", methods=["GET"])
def get_turtle_path(turtle_id: int):
    """
    returns ordered pings for a given turtle as a list of points.
    this is what the map can use to draw a polyline.
    """
    query = text("""
        SELECT p.latitude, p.longitude, p.ping_time
        FROM pings p
        JOIN tags t ON p.tag_id = t.id
        JOIN turtles tu ON tu.tag_id = t.id
        WHERE tu.id = :tid
        ORDER BY p.ping_time;
    """)

    with db.engine.connect() as conn:
        result = conn.execute(query, {"tid": turtle_id})
        rows = [
            {
                "latitude": r.latitude,
                "longitude": r.longitude,
                "ping_time": r.ping_time.isoformat()
            }
            for r in result
        ]

    return jsonify(rows), 200

# list turtles
@app.route("/api/turtles", methods=["GET"])
def list_turtles():
  query = text("""
      SELECT id, name, species, tag_id
      FROM turtles
      ORDER BY id;
  """)
  with db.engine.connect() as conn:
    result = conn.execute(query)
    turtles = [
      {
        "id": r.id,
        "name": r.name,
        "species": r.species,
        "tag_id": r.tag_id,
      }
      for r in result
    ]
  return jsonify(turtles), 200


if __name__ == "__main__":
    print("Registered routes:", app.url_map)
    app.run(debug=True, port=5001)
    