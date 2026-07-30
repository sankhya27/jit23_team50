"""
Flask ML Microservice — internal only, called by the Node.js Express server.
Exposes:
  POST /ml/predict   — run ML + heuristic + anomaly ensemble
  POST /ml/reset     — reset in-memory mitigation state
  GET  /ml/health    — liveness check
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS
from routes.predict import predict_bp

app = Flask(__name__)
CORS(app, origins=["http://localhost:5001", "http://localhost:3000"])


app.register_blueprint(predict_bp)


@app.route('/ml/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "ddos-ml-microservice"})


if __name__ == '__main__':
    app.run(debug=False, port=5000, threaded=True)
