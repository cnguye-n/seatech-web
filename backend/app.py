import os
from flask import Flask, jsonify, request, redirect
from flask_cors import CORS
from pathlib import Path
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry

FRONTEND_DEV = "http://localhost:5173"

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)
CORS(app)

# config
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# example spatial model (POINT in WGS84)
class Location(db.Model):
    id   = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    geom = db.Column(Geometry("POINT", srid=4326))  # lon/lat

with app.app_context():
    db.create_all()

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/api/locations", methods=["GET"])
def list_locations():
    rows = Location.query.all()
    out = []
    for r in rows:
        out.append({"id": r.id, "name": r.name})
    return jsonify(out)

@app.route("/api/locations", methods=["POST"])
def add_location():
    data = request.get_json()
    name = data["name"]
    lon  = float(data["lon"])
    lat  = float(data["lat"])
    wkt  = f"POINT({lon} {lat})"
    loc = Location(name=name, geom=wkt)
    db.session.add(loc)
    db.session.commit()
    return jsonify({"ok": True, "id": loc.id}), 201

@app.route("/", methods=["GET"])
def root():
    return redirect(FRONTEND_DEV, code=302)

print("Registered routes:", app.url_map)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
