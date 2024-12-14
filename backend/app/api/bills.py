from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from app import db
from app.models import Bill, BillAudit, LinkedAccountMeter
from app.schemas import BillSchema, BillAuditSchema
from app.tasks import process_bill_file, export_bills_to_accounting
from flask_jwt_extended import jwt_required

bp = Blueprint('bills', __name__)
bill_schema = BillSchema()
bills_schema = BillSchema(many=True)
bill_audit_schema = BillAuditSchema(many=True)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@bp.route('/bills', methods=['POST'])
@jwt_required()
def create_bill():
    """Upload and process a new bill"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    linked_account_meter_id = request.form.get('linked_account_meter_id')
    if not linked_account_meter_id:
        return jsonify({'error': 'linked_account_meter_id is required'}), 400

    # Verify linked_account_meter exists
    lam = LinkedAccountMeter.query.get(linked_account_meter_id)
    if not lam:
        return jsonify({'error': 'Invalid linked_account_meter_id'}), 404

    # Save file temporarily
    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    # Process file asynchronously
    task = process_bill_file.delay(file_path, linked_account_meter_id)
    
    return jsonify({
        'message': 'Bill processing started',
        'task_id': task.id
    }), 202

@bp.route('/bills', methods=['GET'])
@jwt_required()
def get_bills():
    """Get all bills with optional filtering"""
    # Get query parameters
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build query
    query = Bill.query
    if status:
        query = query.filter(Bill.status == status)
    if start_date:
        query = query.filter(Bill.bill_date >= start_date)
    if end_date:
        query = query.filter(Bill.bill_date <= end_date)
    
    bills = query.all()
    return jsonify(bills_schema.dump(bills)), 200

@bp.route('/bills/<int:id>', methods=['GET'])
@jwt_required()
def get_bill(id):
    """Get a specific bill"""
    bill = Bill.query.get_or_404(id)
    return jsonify(bill_schema.dump(bill)), 200

@bp.route('/bills/<int:id>/audits', methods=['GET'])
@jwt_required()
def get_bill_audits(id):
    """Get audits for a specific bill"""
    bill = Bill.query.get_or_404(id)
    return jsonify(bill_audit_schema.dump(bill.audits)), 200

@bp.route('/bills/<int:id>/approve', methods=['POST'])
@jwt_required()
def approve_bill(id):
    """Approve a bill"""
    bill = Bill.query.get_or_404(id)
    
    if bill.status == 'approved':
        return jsonify({'error': 'Bill is already approved'}), 400
    
    bill.status = 'approved'
    db.session.commit()
    
    return jsonify(bill_schema.dump(bill)), 200

@bp.route('/bills/<int:id>/reject', methods=['POST'])
@jwt_required()
def reject_bill(id):
    """Reject a bill"""
    bill = Bill.query.get_or_404(id)
    
    if bill.status == 'rejected':
        return jsonify({'error': 'Bill is already rejected'}), 400
    
    bill.status = 'rejected'
    db.session.commit()
    
    return jsonify(bill_schema.dump(bill)), 200

@bp.route('/bills/export', methods=['POST'])
@jwt_required()
def export_bills():
    """Export bills to accounting system"""
    bill_ids = request.json.get('bill_ids', [])
    if not bill_ids:
        return jsonify({'error': 'No bills selected for export'}), 400
    
    # Verify all bills exist and are approved
    bills = Bill.query.filter(Bill.id.in_(bill_ids)).all()
    if len(bills) != len(bill_ids):
        return jsonify({'error': 'One or more bills not found'}), 404
    
    if not all(bill.status == 'approved' for bill in bills):
        return jsonify({'error': 'All bills must be approved before export'}), 400
    
    # Start export task
    task = export_bills_to_accounting.delay(bill_ids)
    
    return jsonify({
        'message': 'Bill export started',
        'task_id': task.id
    }), 202
