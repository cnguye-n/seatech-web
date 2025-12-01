import os
from flask import Flask, jsonify, request, redirect
from flask_cors import CORS
from pathlib import Path
from sqlalchemy import text
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

FRONTEND_DEV = "http://localhost:5173"

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app)

# Config
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")

# can use .env later, but for now hardcode the working DB url
# so it matches what was created in psql:
#   user: turtle_user
#   pass: turtle_pass
#   db:   turtle_tracking
app.config["SQLALCHEMY_DATABASE_URI"] = (
    "postgresql+psycopg2://turtle_user:turtle_pass@localhost/turtle_tracking"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# example model using plain lat/lon (no PostGIS needed)
class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

with app.app_context():
    db.create_all()

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



# Debug route: get some pings
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
    Returns ordered pings for a given turtle as a list of points.
    This is what your map can use to draw a polyline.
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
    app.run(debug=True, port=5000)
