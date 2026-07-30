from pymongo import MongoClient
import datetime
import json
import os
import tempfile
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = 'ddos_detection_db'
LEGACY_LOG_FILE = os.path.join(os.path.dirname(__file__), 'prediction_logs.json')
LOG_FILE = os.getenv(
    'PREDICTION_LOG_FILE',
    os.path.join(tempfile.gettempdir(), 'ddos_detection_prediction_logs.json')
)


def _load_file_logs():
    active_log_file = LOG_FILE if os.path.exists(LOG_FILE) else LEGACY_LOG_FILE
    if not os.path.exists(active_log_file):
        return []
    with open(active_log_file, 'r') as f:
        return json.load(f)


def _save_to_file(log_entry):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    logs = _load_file_logs()
    logs.insert(0, {**log_entry, 'timestamp': log_entry['timestamp'].isoformat()})
    logs = logs[:500]
    with open(LOG_FILE, 'w') as f:
        json.dump(logs, f, indent=2)


def get_db_connection():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    return client[DB_NAME]


def log_prediction(user_id, input_data, prediction):
    log_entry = {
        'user_id': user_id,
        'input_data': input_data,
        'prediction': prediction,
        'timestamp': datetime.datetime.utcnow()
    }

    try:
        if MONGO_URI:
            db = get_db_connection()
            db.prediction_logs.insert_one(log_entry)
    except Exception as e:
        print(f"MongoDB unavailable, using local file: {e}")

    try:
        _save_to_file(log_entry)
        return True
    except Exception as e:
        print(f"File logging error: {e}")
        return False


def _filter_logs(logs, user_id=None):
    if user_id:
        return [l for l in logs if l.get('user_id') == user_id]
    return logs


def get_recent_predictions(limit=10, user_id=None):
    logs = []

    try:
        if MONGO_URI:
            db = get_db_connection()
            query = {'user_id': user_id} if user_id else {}
            cursor = db.prediction_logs.find(query).sort('timestamp', -1).limit(limit)
            logs = [{
                'user_id': doc.get('user_id', 'guest'),
                'input_data': doc.get('input_data', {}),
                'prediction': doc.get('prediction', ''),
                'timestamp': doc['timestamp'].isoformat() if doc.get('timestamp') else ''
            } for doc in cursor]
    except Exception:
        pass

    if not logs:
        logs = _load_file_logs()[:limit * 5]

    return _filter_logs(logs, user_id)[:limit]


def get_stats(user_id=None):
    logs = get_recent_predictions(limit=500, user_id=user_id)
    attacks = sum(1 for l in logs if l.get('prediction') == 'DDoS Attack')
    return {
        'total_scans': len(logs),
        'attacks_detected': attacks,
        'normal_traffic': len(logs) - attacks
    }


def get_attack_trends(user_id=None):
    logs = get_recent_predictions(limit=500, user_id=user_id)
    buckets = defaultdict(lambda: {'attacks': 0, 'normal': 0})

    for log in logs:
        ts = log.get('timestamp', '')
        if not ts:
            continue
        try:
            dt = datetime.datetime.fromisoformat(ts.replace('Z', ''))
        except ValueError:
            continue
        key = dt.strftime('%Y-%m-%d %H:00')
        if log.get('prediction') == 'DDoS Attack':
            buckets[key]['attacks'] += 1
        else:
            buckets[key]['normal'] += 1

    sorted_keys = sorted(buckets.keys())[-24:]
    return {
        'labels': sorted_keys,
        'attacks': [buckets[k]['attacks'] for k in sorted_keys],
        'normal': [buckets[k]['normal'] for k in sorted_keys]
    }
