import os
import datetime
from flask import Flask, jsonify, request, redirect, abort
from flask_cors import CORS
from pathlib import Path
from sqlalchemy import text
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

from flask_bcrypt import Bcrypt
from models import db, User
from utility import user_exists
import jwt

FRONTEND_DEV = "http://localhost:5173"

# Environment + Flask app setup
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)


# Config
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")

# can use .env later, but for now hardcoding the working DB url
# so it matches what was created in psql:
#   user: turtle_user
#   pass: turtle_pass
#   db:   turtle_tracking
app.config["SQLALCHEMY_DATABASE_URI"] = (
    "postgresql+psycopg2://turtle_user:turtles@localhost/turtle_tracking"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
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

@app.route("/register", methods = ['POST'])
def register_user():
    email = request.json["email"]
    password = request.json["password"]
    if user_exists(User, email):
        abort(409)
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    print(hashed_password)
    new_user = User(email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({
        "id": new_user.id,
        "email": new_user.email
    })

@app.route("/login", methods=['POST'])
def login_post():
    email = request.json["email"]
    password = request.json["password"]
    user = User.query.filter_by(email=email).first()
    
    if not user or not bcrypt.check_password_hash(user.password, password):
        abort(401)
    
    token = jwt.encode(
        {
            "id": user.id,
            "email": user.email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=48)
        },
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )
    
    return jsonify({
        "email": email,
        "token": token
    }), 200


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
