# ...existing code...
from flask import Flask, jsonify
from flask_cors import CORS
import os, json

app = Flask(__name__)
CORS(app)  # allow frontend dev server to call API

DATA_FILE = os.path.join(os.path.dirname(__file__), 'alerts.json')

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    if not os.path.exists(DATA_FILE):
        return jsonify([]), 200
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f)), 200

@app.route('/api/alerts/ack-all', methods=['POST'])
def ack_all():
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)
    return ('', 204)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
# ...existing code...