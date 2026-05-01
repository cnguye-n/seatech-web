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

class TrackerUpload(db.Model):
    __tablename__ = "tracker_uploads"
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    ping_count = db.Column(db.Integer, nullable=False, default=0)
    duplicate_count = db.Column(db.Integer, nullable=False, default=0)
    uploaded_at = db.Column(db.DateTime, server_default=db.func.now())
    uploaded_by = db.Column(db.String(255), nullable=True)
    owner_group_id = db.Column(db.BigInteger, nullable=True)
    # turtle metadata supplied at upload time
    turtle_name = db.Column(db.String(255), nullable=True)
    species = db.Column(db.String(100), nullable=True)
    sex = db.Column(db.String(50), nullable=True)
    island_origin = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)

class TrackerPing(db.Model):
    __tablename__ = "tracker_pings"
    id = db.Column(db.Integer, primary_key=True)
    upload_id = db.Column(db.Integer, db.ForeignKey("tracker_uploads.id", ondelete="CASCADE"), nullable=False)
    uptime_min = db.Column(db.Float, default=0)
    batt_v = db.Column(db.Float, default=0)
    batt_pct = db.Column(db.Integer, default=0)
    fix_type = db.Column(db.Integer, default=-1)
    siv = db.Column(db.Integer, default=-1)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    surface_fix = db.Column(db.Integer, default=0)
    recorded_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    altitude_m = db.Column(db.Float, nullable=True)
    h_acc_m = db.Column(db.Float, nullable=True)
    speed_mps = db.Column(db.Float, nullable=True)

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

    q = text("""
        insert into public.users (email, name, picture, last_login)
        values (:email, :name, :picture, now())
        on conflict (email) do update
        set name = excluded.name,
            picture = excluded.picture,
            last_login = now()
        returning email, name, picture, role, group_id;
    """)

    with db.engine.begin() as conn:
        row = conn.execute(q, {
            "email": email,
            "name": name,
            "picture": picture
        }).fetchone()

    return {
        "email": row.email,
        "name": row.name,
        "picture": row.picture,
        "role": row.role,
        "group_id": row.group_id,
    }, None

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

def require_group(f):
    @wraps(f)
    @require_auth
    def wrapper(*args, **kwargs):
        if not g.user.get("group_id"):
            return jsonify({"error": "User is not assigned to a group"}), 403
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

@app.route("/api/groups", methods=["GET"])
@require_auth
def list_groups():
    query = text("""
        SELECT id, name, created_at
        FROM public.groups
        ORDER BY name;
    """)

    with db.engine.connect() as conn:
        rows = conn.execute(query).fetchall()

    return jsonify([
        {
            "id": r.id,
            "name": r.name,
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

# upload tracker CSV pings
@app.route("/api/pings/upload", methods=["POST"])
@require_group
def upload_pings():
    data = request.get_json()
    if not data or "pings" not in data:
        return jsonify({"error": "Request body must include 'pings' array"}), 400

    pings = data["pings"]
    filename = data.get("filename", "unknown.csv")
    turtle_name = data.get("turtle_name") or None
    species = data.get("species") or None
    sex = data.get("sex") or None
    island_origin = data.get("island_origin") or None
    notes = data.get("notes") or None

    if not isinstance(pings, list) or len(pings) == 0:
        return jsonify({"error": "No pings to upload"}), 400

    existing_fps = set()
    try:
        existing_rows = TrackerPing.query.with_entities(
            TrackerPing.uptime_min, TrackerPing.latitude, TrackerPing.longitude
        ).all()
        for row in existing_rows:
            fp = f"{row.uptime_min}|{row.latitude}|{row.longitude}"
            existing_fps.add(fp)
    except Exception:
        pass

    unique_pings = []
    duplicate_count = 0

    for p in pings:
        lat = p.get("latitude")
        lon = p.get("longitude")
        uptime = p.get("uptime_min", 0)
        fp = f"{uptime}|{lat}|{lon}"

        if fp in existing_fps:
            duplicate_count += 1
        else:
            unique_pings.append(p)
            existing_fps.add(fp)

    upload = TrackerUpload(
        filename=filename,
        ping_count=len(unique_pings),
        duplicate_count=duplicate_count,
        uploaded_by=g.user["email"],
        owner_group_id=g.user["group_id"],
        turtle_name=turtle_name,
        species=species,
        sex=sex,
        island_origin=island_origin,
        notes=notes,
    )
    db.session.add(upload)
    db.session.flush()

    for p in unique_pings:
        ping = TrackerPing(
            upload_id=upload.id,
            uptime_min=float(p.get("uptime_min", 0)),
            batt_v=float(p.get("batt_v", 0)),
            batt_pct=int(p.get("batt_pct", 0)),
            fix_type=int(p.get("fix_type", -1)),
            siv=int(p.get("siv", -1)),
            latitude=float(p["latitude"]) if p.get("latitude") is not None else None,
            longitude=float(p["longitude"]) if p.get("longitude") is not None else None,
            surface_fix=int(p.get("surface_fix", 0)),
            recorded_at=p.get("recorded_at"),
            altitude_m=float(p["altitude_m"]) if p.get("altitude_m") is not None else None,
            h_acc_m=float(p["h_acc_m"]) if p.get("h_acc_m") is not None else None,
            speed_mps=float(p["speed_mps"]) if p.get("speed_mps") is not None else None,
        )
        db.session.add(ping)

    db.session.commit()

    return jsonify({
        "ok": True,
        "upload_id": upload.id,
        "saved": len(unique_pings),
        "duplicates_skipped": duplicate_count,
    }), 201


# list history
@app.route("/api/uploads", methods=["GET"])
@require_group
def list_uploads():
    group_id = g.user["group_id"]

    query = text("""
        SELECT
            u.id,
            u.filename,
            u.ping_count,
            u.duplicate_count,
            u.uploaded_at,
            u.uploaded_by,
            u.turtle_name,
            u.species,
            u.sex,
            u.island_origin,
            u.notes,
            u.owner_group_id,
            CASE
                WHEN u.owner_group_id = :group_id THEN 'owner'
                ELSE us.permission
            END AS access_level,
            CASE
                WHEN u.owner_group_id = :group_id THEN false
                ELSE true
            END AS is_shared
        FROM public.tracker_uploads u
        LEFT JOIN public.tracker_upload_shares us
          ON us.upload_id = u.id
         AND us.shared_with_group_id = :group_id
        WHERE u.owner_group_id = :group_id
           OR us.shared_with_group_id = :group_id
        ORDER BY u.uploaded_at DESC
        LIMIT 50;
    """)

    with db.engine.connect() as conn:
        rows = conn.execute(query, {"group_id": group_id}).fetchall()

    return jsonify([
        {
            "id": r.id,
            "filename": r.filename,
            "ping_count": r.ping_count,
            "duplicate_count": r.duplicate_count,
            "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else None,
            "uploaded_by": r.uploaded_by,
            "turtle_name": r.turtle_name,
            "species": r.species,
            "sex": r.sex,
            "island_origin": r.island_origin,
            "notes": r.notes,
            "owner_group_id": r.owner_group_id,
            "access_level": r.access_level,
            "is_shared": r.is_shared,
        }
        for r in rows
    ]), 200

# delete an upload and all its pings
@app.route("/api/uploads/<int:upload_id>", methods=["DELETE"])
@require_group
def delete_upload(upload_id: int):
    upload = TrackerUpload.query.get(upload_id)
    if not upload:
        return jsonify({"error": "Upload not found"}), 404

    if upload.owner_group_id != g.user["group_id"]:
        return jsonify({"error": "Only the owner group can delete this upload"}), 403

    TrackerPing.query.filter_by(upload_id=upload_id).delete()
    db.session.delete(upload)
    db.session.commit()

    return jsonify({"ok": True, "deleted_id": upload_id}), 200

@app.route("/api/uploads/<int:upload_id>/share", methods=["POST"])
@require_group
def share_upload(upload_id: int):
    body = request.get_json() or {}
    shared_with_group_id = body.get("group_id")
    permission = body.get("permission", "viewer")

    if not shared_with_group_id:
        return jsonify({"error": "group_id is required"}), 400

    if permission not in {"viewer", "editor"}:
        return jsonify({"error": "Invalid permission"}), 400

    with db.engine.begin() as conn:
        upload = conn.execute(text("""
            SELECT id, owner_group_id
            FROM public.tracker_uploads
            WHERE id = :upload_id
        """), {"upload_id": upload_id}).fetchone()

        if not upload:
            return jsonify({"error": "Upload not found"}), 404

        if upload.owner_group_id != g.user["group_id"]:
            return jsonify({"error": "Only the owner group can share this upload"}), 403

        if int(shared_with_group_id) == int(g.user["group_id"]):
            return jsonify({"error": "Cannot share with the owner group"}), 400

        conn.execute(text("""
            INSERT INTO public.tracker_upload_shares (upload_id, shared_with_group_id, permission, shared_by_email)
            VALUES (:upload_id, :shared_with_group_id, :permission, :shared_by_email)
            ON CONFLICT (upload_id, shared_with_group_id)
            DO UPDATE SET
                permission = EXCLUDED.permission,
                shared_by_email = EXCLUDED.shared_by_email,
                created_at = now()
        """), {
            "upload_id": upload_id,
            "shared_with_group_id": shared_with_group_id,
            "permission": permission,
            "shared_by_email": g.user["email"],
        })

    return jsonify({
        "ok": True,
        "upload_id": upload_id,
        "shared_with_group_id": shared_with_group_id,
        "permission": permission,
    }), 200

@app.route("/api/uploads/<int:upload_id>/shares", methods=["GET"])
@require_group
def get_upload_shares(upload_id: int):
    with db.engine.connect() as conn:
        upload = conn.execute(text("""
            SELECT id, owner_group_id
            FROM public.tracker_uploads
            WHERE id = :upload_id
        """), {"upload_id": upload_id}).fetchone()

        if not upload:
            return jsonify({"error": "Upload not found"}), 404

        if upload.owner_group_id != g.user["group_id"]:
            return jsonify({"error": "Only the owner group can view shares"}), 403

        rows = conn.execute(text("""
            SELECT s.shared_with_group_id, g.name AS group_name, s.permission, s.shared_by_email, s.created_at
            FROM public.tracker_upload_shares s
            JOIN public.groups g ON g.id = s.shared_with_group_id
            WHERE s.upload_id = :upload_id
            ORDER BY g.name
        """), {"upload_id": upload_id}).fetchall()

    return jsonify([
        {
            "group_id": r.shared_with_group_id,
            "group_name": r.group_name,
            "permission": r.permission,
            "shared_by_email": r.shared_by_email,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]), 200
       
# get pings for a specific upload
@app.route("/api/uploads/<int:upload_id>/pings", methods=["GET"])
@require_group
def get_upload_pings(upload_id: int):
    group_id = g.user["group_id"]

    access_query = text("""
        SELECT u.id
        FROM public.tracker_uploads u
        LEFT JOIN public.tracker_upload_shares us
          ON us.upload_id = u.id
         AND us.shared_with_group_id = :group_id
        WHERE u.id = :upload_id
          AND (
            u.owner_group_id = :group_id
            OR us.shared_with_group_id = :group_id
          )
    """)

    with db.engine.connect() as conn:
        allowed = conn.execute(access_query, {
            "upload_id": upload_id,
            "group_id": group_id
        }).fetchone()

        if not allowed:
            return jsonify({"error": "Forbidden"}), 403

    pings = TrackerPing.query.filter_by(upload_id=upload_id)\
        .order_by(TrackerPing.uptime_min).all()

    return jsonify([
        {
            "id": p.id,
            "uptime_min": p.uptime_min,
            "batt_v": p.batt_v,
            "batt_pct": p.batt_pct,
            "fix_type": p.fix_type,
            "siv": p.siv,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "surface_fix": p.surface_fix,
            "recorded_at": p.recorded_at.isoformat() if p.recorded_at else None,
            "altitude_m": p.altitude_m,
            "h_acc_m": p.h_acc_m,
            "speed_mps": p.speed_mps,
        }
        for p in pings
    ]), 200

# get all tracker pings (with optional date range filter)
@app.route("/api/tracker-pings", methods=["GET"])
def get_all_tracker_pings():
    query = TrackerPing.query.filter(
        TrackerPing.latitude.isnot(None),
        TrackerPing.longitude.isnot(None),
    )

    start = request.args.get("start")
    end = request.args.get("end")

    if start:
        query = query.filter(TrackerPing.recorded_at >= start)
    if end:
        query = query.filter(TrackerPing.recorded_at <= end + "T23:59:59")

    pings = query.order_by(TrackerPing.recorded_at, TrackerPing.uptime_min).all()

    return jsonify([
        {
            "id": p.id,
            "upload_id": p.upload_id,
            "uptime_min": p.uptime_min,
            "batt_v": p.batt_v,
            "batt_pct": p.batt_pct,
            "fix_type": p.fix_type,
            "siv": p.siv,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "surface_fix": p.surface_fix,
            "recorded_at": p.recorded_at.isoformat() if p.recorded_at else None,
            "altitude_m": p.altitude_m,
            "h_acc_m": p.h_acc_m,
            "speed_mps": p.speed_mps,
        }
        for p in pings
    ]), 200


# delete a single ping by ID
@app.route("/api/tracker-pings/<int:ping_id>", methods=["DELETE"])
@require_group
def delete_single_ping(ping_id: int):
    ping = TrackerPing.query.get(ping_id)
    if not ping:
        return jsonify({"error": "Ping not found"}), 404

    upload = TrackerUpload.query.get(ping.upload_id)
    if not upload:
        return jsonify({"error": "Upload not found"}), 404

    if upload.owner_group_id != g.user["group_id"]:
        return jsonify({"error": "Only the owner group can delete this ping"}), 403

    if upload.ping_count and upload.ping_count > 0:
        upload.ping_count -= 1

    db.session.delete(ping)
    db.session.commit()
    return jsonify({"ok": True, "deleted_id": ping_id, "upload_id": ping.upload_id}), 200

# Route for turtle path
@app.route("/api/turtles/<int:turtle_id>/path", methods=["GET"])
@require_auth
def get_turtle_path(turtle_id: int):
    group_id = g.user.get("group_id")

    if not group_id:
        return jsonify({"error": "User is not assigned to a group"}), 403

    access_query = text("""
        SELECT id
        FROM public.turtles
        WHERE id = :tid
          AND owner_group_id = :group_id
    """)

    with db.engine.connect() as conn:
        allowed = conn.execute(access_query, {
            "tid": turtle_id,
            "group_id": group_id
        }).fetchone()

        if not allowed:
            return jsonify({"error": "Forbidden"}), 403

        path_query = text("""
            SELECT p.latitude, p.longitude, p.ping_time
            FROM public.pings p
            JOIN public.tags t ON p.tag_id = t.id
            JOIN public.turtles tu ON tu.tag_id = t.id
            WHERE tu.id = :tid
            ORDER BY p.ping_time;
        """)

        result = conn.execute(path_query, {"tid": turtle_id})
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
@require_auth
def list_turtles():
    group_id = g.user.get("group_id")

    if not group_id:
        return jsonify({"error": "User is not assigned to a group"}), 403

    query = text("""
        SELECT id, name, species, tag_id, owner_group_id
        FROM public.turtles
        WHERE owner_group_id = :group_id
        ORDER BY id;
    """)

    with db.engine.connect() as conn:
        result = conn.execute(query, {"group_id": group_id})
        turtles = [
            {
                "id": r.id,
                "name": r.name,
                "species": r.species,
                "tag_id": r.tag_id,
                "owner_group_id": r.owner_group_id,
                "access_level": "owner"
            }
            for r in result
        ]

    return jsonify(turtles), 200

if __name__ == "__main__":
    print("Registered routes:", app.url_map)
    app.run(debug=True, port=5001)