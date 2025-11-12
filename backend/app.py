from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows requests from the frontend during dev

# health check
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

# example geo-enabled resource you already have
@app.route("/api/locations", methods=["GET"])
def get_locations():
    # TODO: query your DB (e.g., Location.query.all())
    # returning dummy data for now:
    return jsonify([
        {"id": 1, "name": "Tokyo", "lon": 139.6917, "lat": 35.6895},
        {"id": 2, "name": "LA",    "lon": -118.2437, "lat": 34.0522},
    ])

@app.route("/api/locations", methods=["POST"])
def add_location():
    data = request.get_json()
    # TODO: validate + insert into DB
    return jsonify({"ok": True, "received": data}), 201

if __name__ == "__main__":
    app.run(debug=True, port=5000)
