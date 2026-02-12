import os
from app import app  # backend/app.py has app = Flask(__name__)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
