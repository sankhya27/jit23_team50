import numpy as np
import joblib
import os

BACKEND_DIR = os.path.join(os.path.dirname(__file__), '..')
SCALER_PATH = os.path.join(BACKEND_DIR, 'scaler.pkl')

_scaler = None
try:
    if os.path.exists(SCALER_PATH):
        _scaler = joblib.load(SCALER_PATH)
except Exception:
    _scaler = None


def preprocess_features(data):
    data = data or {}
    required_fields = ('packet_rate', 'duration', 'byte_count')
    missing_fields = [field for field in required_fields if data.get(field) in (None, '')]

    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

    packet_rate = float(data.get('packet_rate'))
    duration = float(data.get('duration'))
    byte_count = float(data.get('byte_count'))

    if packet_rate < 0 or duration < 0 or byte_count < 0:
        raise ValueError('Traffic values cannot be negative')

    features = np.array([[packet_rate, duration, byte_count]])

    if _scaler is not None:
        features = _scaler.transform(features)

    return features
