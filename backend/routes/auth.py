from flask import Blueprint, request, jsonify
from database.users import create_user, verify_user
from utils.auth_helpers import create_token

auth_bp = Blueprint('auth_bp', __name__)


@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    user, error = create_user(username, email, password)
    if error:
        return jsonify({'error': error}), 409

    token = create_token(user['username'])
    return jsonify({
        'status': 'success',
        'token': token,
        'username': user['username']
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    user, error = verify_user(username, password)
    if error:
        return jsonify({'error': error}), 401

    token = create_token(user['username'])
    return jsonify({
        'status': 'success',
        'token': token,
        'username': user['username']
    })
