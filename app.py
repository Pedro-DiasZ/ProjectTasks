from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, Task, User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta

app = Flask(__name__)

# Configuração CORS melhorada
CORS(app, resources={
    r"/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

app.config['JWT_SECRET_KEY'] = 'sua-chave-secreta-aqui'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)  # Token válido por 24h
jwt = JWTManager(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

# Handler para requisições OPTIONS (preflight CORS)
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'ok'})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
        return response, 200
    

@app.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()
    tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([{'id': task.id, 'title': task.title, 'completed': task.completed} for task in tasks])

@app.route('/tasks', methods=['POST'])
@jwt_required()
def post_tasks():
    data = request.get_json()
    user_id = get_jwt_identity()
    if not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    new_task = Task(title=data['title'], user_id=user_id, completed=False)
    db.session.add(new_task)
    db.session.commit()
    return jsonify({'id': new_task.id, 'title': new_task.title, 'completed': new_task.completed}), 201


@app.route('/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = get_jwt_identity()
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
    user_id = get_jwt_identity()
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
    return jsonify({'id': task.id, 'title': task.title, 'completed': task.completed}), 200


@app.route('/')
def index():
    return "Task Management API is running."

@app.route('/register', methods=['POST', 'OPTIONS'])
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


@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    data = request.get_json()
    
    if not data.get('username') or not data.get('senha'):
        return jsonify({'error': 'Username and password are required'}), 400

    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.senha, data['senha']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username
        }
    }), 200
    
# jtw resources
@jwt.unauthorized_loader
def unauthorized_callback(error):
    return jsonify({'error': 'Missing or invalid token'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 422

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401


if __name__ == '__main__':
    app.run(debug=True)
