import os, requests
from flask import Flask, jsonify, request, redirect, g
from flask_cors import CORS
from pathlib import Path
from sqlalchemy import text
from dotenv import load_dotenv
load_dotenv()
print("DATABASE_URL =", os.getenv("DATABASE_URL"))

from flask_sqlalchemy import SQLAlchemy
from auth import require_auth
from roles import get_role


FRONTEND_DEV = "http://localhost:5173"

# Environment + Flask app setup
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)


# Config
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")

# can use .env later, but for now hardcoding the working DB url
# so it matches what was created in psql:
#   user: turtle_user
#   pass: turtle_pass
#   db:   turtle_tracking
#app.config["SQLALCHEMY_DATABASE_URI"] = (
#    "postgresql+psycopg2://turtle_user:turtle_pass@localhost/turtle_tracking"
#)
 
#commented the above to use supabase hosted db instead of hardcoded
# Database
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


# Routes
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

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

@app.route("/", methods=["GET"])
def root():
    return redirect(FRONTEND_DEV, code=302)

print("Registered routes:", app.url_map)

# debug route: get some pings
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

@app.get("/api/me")
#@require_auth
def me():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401
    
    token = auth.split(" ", 1)[1].strip()
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        return jsonify({"error": "Server misconfiguration: missing GOOGLE_CLIENT_ID"}), 500
    
    r = requests.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": token})
    if r.status_code != 200:
        return jsonify({"error": "Invalid token"}), 401
    
    payload = r.json()
    
      # prefer name, fallback to given_name, fallback to email
    email = payload.get("email", "")
    name = payload.get("name") or payload.get("given_name") or email
    picture = payload.get("picture")

    # if you have a get_role helper, use it; otherwise default to "viewer"
    try:
        role = get_role(email)
    except NameError:
        role = "viewer"

    return jsonify({
        "email": email,
        "name": name,
        "picture": picture,
        "role": role,
    }), 200
    
if __name__ == "__main__":
    print("Registered routes:", app.url_map)
    app.run(debug=True, port=5001)
    