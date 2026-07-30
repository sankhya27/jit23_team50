from flask import Blueprint, request, jsonify
from utils.preprocess import preprocess_features
from heuristic_detection import heuristic
from sklearn.ensemble import IsolationForest
import numpy as np
import joblib
import os
import time

predict_bp = Blueprint("predict_bp", __name__)

# ------------------------------------------------------------
# Load ML Model
# ------------------------------------------------------------

BACKEND_DIR = os.path.join(
    os.path.dirname(__file__),
    ".."
)

MODEL_PATH = os.path.join(
    BACKEND_DIR,
    "model.pkl"
)

try:

    model = joblib.load(MODEL_PATH)

    print("✅ ML model loaded")

except FileNotFoundError:

    model = None

    print("❌ model.pkl not found")

# ------------------------------------------------------------
# Isolation Forest
# ------------------------------------------------------------

rng = np.random.default_rng(42)

normal_training = np.column_stack([

    rng.normal(1200, 500, 2000),

    rng.normal(40, 15, 2000),

    rng.normal(200000, 80000, 2000)

])

isolation_forest = IsolationForest(

    contamination=0.05,

    random_state=42

)

isolation_forest.fit(normal_training)

# ------------------------------------------------------------
# Feature Extraction
# ------------------------------------------------------------

def extract_raw_features(data):

    return np.array([[

        float(data.get("packet_rate", 0)),

        float(data.get("duration", 0)),

        float(data.get("byte_count", 0))

    ]])
from flask import Blueprint, request, jsonify
from utils.preprocess import preprocess_features
from heuristic_detection import heuristic
from sklearn.ensemble import IsolationForest
import numpy as np
import joblib
import os
import time

predict_bp = Blueprint("predict_bp", __name__)

# ------------------------------------------------------------
# Load ML Model
# ------------------------------------------------------------

BACKEND_DIR = os.path.join(
    os.path.dirname(__file__),
    ".."
)

MODEL_PATH = os.path.join(
    BACKEND_DIR,
    "model.pkl"
)

try:

    model = joblib.load(MODEL_PATH)

    print("✅ ML model loaded")

except FileNotFoundError:

    model = None

    print("❌ model.pkl not found")

# ------------------------------------------------------------
# Isolation Forest
# ------------------------------------------------------------

rng = np.random.default_rng(42)

normal_training = np.column_stack([

    rng.normal(1200, 500, 2000),

    rng.normal(40, 15, 2000),

    rng.normal(200000, 80000, 2000)

])

isolation_forest = IsolationForest(

    contamination=0.05,

    random_state=42

)

isolation_forest.fit(normal_training)

# ------------------------------------------------------------
# Feature Extraction
# ------------------------------------------------------------

def extract_raw_features(data):

    return np.array([[

        float(data.get("packet_rate", 0)),

        float(data.get("duration", 0)),

        float(data.get("byte_count", 0))

    ]])
# ------------------------------------------------------------
# Smart Ensemble Prediction
# ------------------------------------------------------------

def predict_ensemble(packet_data, scaled_features, raw_features):

    if model is None:

        raise RuntimeError("ML model not loaded")

    # --------------------------------------------------------
    # ML Prediction
    # --------------------------------------------------------

    if hasattr(model, "predict_proba"):

        ml_score = float(

            model.predict_proba(scaled_features)[0][1]

        )

    else:

        prediction = float(

            model.predict(scaled_features)[0]

        )

        ml_score = max(

            0.0,

            min(1.0, prediction)

        )

    # --------------------------------------------------------
    # Heuristic Score
    # --------------------------------------------------------

    heuristic_score = float(

        heuristic.get_heuristic_score(packet_data)

    )

    # --------------------------------------------------------
    # Isolation Forest
    # --------------------------------------------------------

    anomaly_prediction = isolation_forest.predict(

        raw_features

    )

    anomaly_score = (

        0.85

        if anomaly_prediction[0] == -1

        else 0.15

    )

    # --------------------------------------------------------
    # Weighted Ensemble
    #
    # ML should dominate.
    # Heuristic supports it.
    # Isolation Forest has least influence.
    # --------------------------------------------------------

    ensemble_score = (

        ml_score * 0.60 +

        heuristic_score * 0.30 +

        anomaly_score * 0.10

    )

    # --------------------------------------------------------
    # Enterprise-style Detection Logic
    # --------------------------------------------------------

    is_attack = False

    if ml_score >= 0.85:

        is_attack = True

    elif (

        ensemble_score >= 0.78

        and

        heuristic_score >= 0.60

    ):

        is_attack = True

    # --------------------------------------------------------
    # Better Confidence
    # --------------------------------------------------------

    if is_attack:

        confidence = max(

            ml_score,

            ensemble_score

        )

    else:

        confidence = 1 - ensemble_score

    confidence = round(

        max(

            0.05,

            min(0.99, confidence)

        ),

        4

    )

    return {

        "ml_score": round(ml_score, 4),

        "heuristic_score": round(

            heuristic_score,

            4

        ),

        "anomaly_score": round(

            anomaly_score,

            4

        ),

        "ensemble_score": round(

            ensemble_score,

            4

        ),

        "is_attack": is_attack,

        "confidence": confidence

    }
# ------------------------------------------------------------
# Prediction Endpoint
# ------------------------------------------------------------

@predict_bp.route("/ml/predict", methods=["POST"])
def predict():

    start_time = time.time()

    try:

        if model is None:

            return jsonify({

                "error": "ML model not found. Train model first."

            }), 503

        data = request.json or {}

        if not data:

            return jsonify({

                "error": "Empty request body."

            }), 400

        required = (

            "packet_rate",

            "duration",

            "byte_count"

        )

        missing = [

            field

            for field in required

            if data.get(field) in (None, "", [])

        ]

        if missing:

            return jsonify({

                "error":

                f"Missing fields: {', '.join(missing)}"

            }), 400

        # --------------------------------------------------

        scaled_features = preprocess_features(data)

        raw_features = extract_raw_features(data)

        result = predict_ensemble(

            data,

            scaled_features,

            raw_features

        )

        latency_ms = round(

            (time.time() - start_time) * 1000,

            2

        )

        # --------------------------------------------------
        # Traffic Label
        # --------------------------------------------------

        if result["is_attack"]:

            protocol = str(

                data.get("protocol", "")

            ).upper()

            if protocol == "UDP":

                traffic_type = "UDP Flood"

            elif protocol == "HTTP":

                traffic_type = "HTTP Flood"

            elif protocol == "TCP":

                traffic_type = "SYN Flood"

            else:

                traffic_type = "Generic DDoS"

        else:

            traffic_type = "Normal Traffic"

        # --------------------------------------------------

        return jsonify({

            "is_attack":

                result["is_attack"],

            "traffic_type":

                traffic_type,

            "confidence":

                result["confidence"],

            "detection_methods": {

                "ml_model":

                    result["ml_score"],

                "heuristic":

                    result["heuristic_score"],

                "anomaly_detection":

                    result["anomaly_score"]

            },

            "ensemble_score":

                result["ensemble_score"],

            "detection_latency_ms":

                latency_ms

        })

    except ValueError as e:

        return jsonify({

            "error": str(e)

        }), 400

    except Exception as e:

        return jsonify({

            "error":

            f"Prediction failed: {str(e)}"

        }), 500