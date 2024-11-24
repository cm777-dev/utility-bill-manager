from datetime import datetime
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    name = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    bills = db.relationship('Bill', backref='owner', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Bill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    utility_type = db.Column(db.String(50), nullable=False)  # electricity, water, gas, etc.
    bill_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='unpaid')  # unpaid, paid, overdue
    file_path = db.Column(db.String(200))  # S3 path to bill PDF/image
    usage_amount = db.Column(db.Float)  # e.g., kWh for electricity
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'utility_type': self.utility_type,
            'bill_date': self.bill_date.isoformat(),
            'due_date': self.due_date.isoformat(),
            'amount': self.amount,
            'status': self.status,
            'usage_amount': self.usage_amount,
            'created_at': self.created_at.isoformat()
        }
