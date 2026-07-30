import json
import os
from werkzeug.security import generate_password_hash, check_password_hash

USERS_FILE = os.path.join(os.path.dirname(__file__), 'users.json')


def _load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, 'r') as f:
        return json.load(f)


def _save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)


def create_user(username, email, password):
    users = _load_users()
    username = username.strip().lower()

    if username in users:
        return None, 'Username already exists'

    if any(u.get('email', '').lower() == email.strip().lower() for u in users.values()):
        return None, 'Email already registered'

    users[username] = {
        'username': username,
        'email': email.strip().lower(),
        'password_hash': generate_password_hash(password)
    }
    _save_users(users)
    return users[username], None


def verify_user(username, password):
    users = _load_users()
    username = username.strip().lower()
    user = users.get(username)

    if not user or not check_password_hash(user['password_hash'], password):
        return None, 'Invalid username or password'

    return user, None
