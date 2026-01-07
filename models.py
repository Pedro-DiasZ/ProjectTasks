from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(300))
    completed = db.Column(db.Boolean, default=False)
    user_owner = db.Column(db.String(100), nullable=True)
