import datetime
import os
from flask import Flask, jsonify, request, redirect, abort
from flask_cors import CORS
from pathlib import Path
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry

from models import db, User
from utility import user_exists
import jwt

FRONTEND_DEV = "http://localhost:5173"

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)


# config
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


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

    



print("Registered routes:", app.url_map)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
