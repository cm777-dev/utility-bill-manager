import os
from datetime import datetime
from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import boto3
from app import db
from app.api import bp
from app.models import Bill

s3 = boto3.client(
    's3',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
)

@bp.route('/bills', methods=['POST'])
@jwt_required()
def create_bill():
    current_user_id = get_jwt_identity()
    
    # Handle file upload
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    # Upload to S3
    file_path = f'bills/{current_user_id}/{datetime.now().strftime("%Y%m%d_%H%M%S")}_{file.filename}'
    s3.upload_fileobj(
        file,
        current_app.config['S3_BUCKET_NAME'],
        file_path
    )
    
    # Create bill record
    data = request.form
    bill = Bill(
        user_id=current_user_id,
        utility_type=data['utility_type'],
        bill_date=datetime.strptime(data['bill_date'], '%Y-%m-%d').date(),
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date(),
        amount=float(data['amount']),
        usage_amount=float(data.get('usage_amount', 0)),
        file_path=file_path
    )
    
    db.session.add(bill)
    db.session.commit()
    
    return jsonify(bill.to_dict()), 201

@bp.route('/bills', methods=['GET'])
@jwt_required()
def get_bills():
    current_user_id = get_jwt_identity()
    bills = Bill.query.filter_by(user_id=current_user_id).order_by(Bill.bill_date.desc()).all()
    return jsonify([bill.to_dict() for bill in bills])

@bp.route('/bills/<int:id>', methods=['GET'])
@jwt_required()
def get_bill(id):
    current_user_id = get_jwt_identity()
    bill = Bill.query.filter_by(id=id, user_id=current_user_id).first_or_404()
    return jsonify(bill.to_dict())

@bp.route('/bills/<int:id>', methods=['PUT'])
@jwt_required()
def update_bill(id):
    current_user_id = get_jwt_identity()
    bill = Bill.query.filter_by(id=id, user_id=current_user_id).first_or_404()
    
    data = request.get_json()
    for field in ['utility_type', 'amount', 'status', 'usage_amount']:
        if field in data:
            setattr(bill, field, data[field])
            
    db.session.commit()
    return jsonify(bill.to_dict())

@bp.route('/bills/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_bill(id):
    current_user_id = get_jwt_identity()
    bill = Bill.query.filter_by(id=id, user_id=current_user_id).first_or_404()
    
    # Delete file from S3
    if bill.file_path:
        s3.delete_object(
            Bucket=current_app.config['S3_BUCKET_NAME'],
            Key=bill.file_path
        )
    
    db.session.delete(bill)
    db.session.commit()
    return '', 204
