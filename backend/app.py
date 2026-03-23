from flask import Flask, jsonify, request
from flask_cors import CORS
from .models import db, Task, User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from flask_jwt_extended import create_refresh_token, set_refresh_cookies, unset_jwt_cookies

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

app = Flask(__name__)

def require_env(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value

def parse_origins(raw):
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

allowed_origins = parse_origins(os.getenv("FRONTEND_ORIGINS", "https://project-tasks-ten.vercel.app,http://localhost:5500,http://127.0.0.1:5500"))

CORS(app,
    resources={r"/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
    }},
    supports_credentials=True  # ✅ correto aqui fora
)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)
app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
app.config["JWT_REFRESH_COOKIE_PATH"] = "/refresh"
app.config["JWT_COOKIE_SECURE"] = True   # HTTPS em prod
app.config["JWT_COOKIE_SAMESITE"] = "Lax"
jwt = JWTManager(app)

app.config['SQLALCHEMY_DATABASE_URI'] = require_env('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_pre_ping": True,
}

logging.basicConfig(level=logging.INFO)
db.init_app(app)

with app.app_context():
    db.create_all()


def serialize_task(task):
    return {
        'id': task.id,
        'title': task.title,
        'completed': task.completed,
        'created_at': task.created_at.isoformat() if task.created_at else None,
        'updated_at': task.updated_at.isoformat() if task.updated_at else None,
    }

@app.route('/')
def index():
    return "Task Management API is running."

@app.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = int(get_jwt_identity())
    tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([serialize_task(task) for task in tasks])

@app.route('/tasks', methods=['POST'])
@jwt_required()
def post_tasks():
    data = request.get_json()
    user_id = int(get_jwt_identity())
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    new_task = Task(title=data['title'], user_id=user_id, completed=False)
    db.session.add(new_task)
    db.session.commit()
    return jsonify(serialize_task(new_task)), 201

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404
    if task.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted'}), 200

@app.route('/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404
    if task.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if 'title' in data:
        task.title = data['title']
    if 'completed' in data:
        task.completed = data['completed']
    db.session.commit()
    return jsonify(serialize_task(task)), 200

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data.get('username') or not data.get('senha'):
        return jsonify({'error': 'Username and password are required'}), 400
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 409
    new_user = User(username=data['username'], senha=generate_password_hash(data['senha']))
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'id': new_user.id, 'username': new_user.username}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data.get('username') or not data.get('senha'):
        return jsonify({'error': 'Username and password are required'}), 400
    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.senha, data['senha']):
        return jsonify({'error': 'Invalid credentials'}), 401

    identity = str(user.id)
    access_token  = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)

    resp = jsonify({'access_token': access_token})
    set_refresh_cookies(resp, refresh_token)
    return resp, 200


@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    new_acess_token = create_access_token(identity=identity)
    return jsonify({'access_token': new_acess_token}), 200

@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    resp = jsonify({'message': 'Logged out'})
    unset_jwt_cookies(resp)
    return resp, 200

@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify({'error': 'Missing or invalid token'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(405)
def method_not_allowed_error(error):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    logging.exception("Unhandled server error")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    debug_enabled = os.getenv("FLASK_DEBUG", "false").lower() in {"1", "true", "yes"}
    app.run(debug=debug_enabled)
