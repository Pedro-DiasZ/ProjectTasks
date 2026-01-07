import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, Task

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

database_url = os.getenv('DATABASE_URL')
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/tasks', methods=['GET'])
def get_tasks():
    user = request.args.get('user')
    if user:
        tasks = Task.query.filter_by(user_owner=user).all()
    else:
        tasks = []
    
    return jsonify([{
        'id': task.id, 
        'title': task.title, 
        'description': task.description,
        'completed': task.completed
    } for task in tasks])

@app.route('/tasks', methods=['POST'])
def post_tasks():
    data = request.get_json()
    # Salva o título e também o usuário que veio do frontend
    new_task = Task(
        title=data['title'], 
        description=data.get('description'),
        user_owner=data.get('user'), # Vem do corpo do JSON no seu JS
        completed=False
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({'id': new_task.id, 'title': new_task.title}), 201

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted'}), 200

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data.get('description')
    if 'completed' in data:
        task.completed = data['completed']
        
    db.session.commit()
    return jsonify({'id': task.id, 'title': task.title, 'completed': task.completed}), 200

@app.route('/')
def index():
    return "Task Management API is running."

if __name__ == '__main__':
    app.run(debug=True)
