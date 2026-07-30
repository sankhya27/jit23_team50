import jwt
from functools import wraps
from flask import request, jsonify
from config import Config


def create_token(username):
    return jwt.encode(
        {'username': username},
        Config.SECRET_KEY,
        algorithm='HS256'
    )


def decode_token(token):
    return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])


def get_current_user():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        payload = decode_token(auth[7:])
        return payload.get('username')
    except jwt.PyJWTError:
        return None


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        return f(user, *args, **kwargs)
    return decorated
