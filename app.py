from flask import Flask, jsonify, request;
from flask_cors import CORS;
from models import db, Task;

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()
    

@app.route('/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all();
    return jsonify([{'id': task.id, 'title': task.title, 'description': task.description} for task in tasks])

@app.route('/tasks', methods=['POST'])
def post_tasks():
    data = request.get_json()
    new_task = Task(title=data['title'], description=data.get('description'))
    db.session.add(new_task)
    db.session.commit()
    return jsonify({'id': new_task.id, 'title': new_task.title, 'description': new_task.description}), 201


@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404
    db.session.delete(task);
    db.session.commit();
    return jsonify({'message': 'Task deleted'}), 200

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404
    data = request.get_json();
    task.title = data['title'];
    task.description = data.get('description')
    db.session.commit();
    return jsonify({'id': task.id, 'title': task.title, 'description': task.description}), 200


@app.route('/')
def index():
    return "Task Management API is running."

if __name__ == '__main__':
    app.run(debug=True);
