from flask import Blueprint, jsonify
from database.db import get_recent_predictions, get_stats, get_attack_trends
from utils.auth_helpers import get_current_user

history_bp = Blueprint('history_bp', __name__)


@history_bp.route('/history', methods=['GET'])
def history():
    user_id = get_current_user()
    return jsonify({'status': 'success', 'logs': get_recent_predictions(user_id=user_id)})


@history_bp.route('/stats', methods=['GET'])
def stats():
    user_id = get_current_user()
    return jsonify({'status': 'success', **get_stats(user_id=user_id)})


@history_bp.route('/trends', methods=['GET'])
def trends():
    user_id = get_current_user()
    return jsonify({'status': 'success', **get_attack_trends(user_id=user_id)})
