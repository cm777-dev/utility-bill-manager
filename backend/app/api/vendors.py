from flask import Blueprint, request, jsonify
from app import db
from app.models import Vendor, RateSchedule
from app.schemas import VendorSchema, RateScheduleSchema
from flask_jwt_extended import jwt_required

bp = Blueprint('vendors', __name__)

# Initialize schemas
vendor_schema = VendorSchema()
vendors_schema = VendorSchema(many=True)
rate_schedule_schema = RateScheduleSchema()
rate_schedules_schema = RateScheduleSchema(many=True)

@bp.route('/vendors', methods=['POST'])
@jwt_required()
def create_vendor():
    """Create a new vendor"""
    data = request.get_json()
    errors = vendor_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    vendor = Vendor(**data)
    db.session.add(vendor)
    db.session.commit()
    return jsonify(vendor_schema.dump(vendor)), 201

@bp.route('/vendors', methods=['GET'])
@jwt_required()
def get_vendors():
    """Get all vendors"""
    vendors = Vendor.query.all()
    return jsonify(vendors_schema.dump(vendors)), 200

@bp.route('/vendors/<int:id>', methods=['GET'])
@jwt_required()
def get_vendor(id):
    """Get a specific vendor"""
    vendor = Vendor.query.get_or_404(id)
    return jsonify(vendor_schema.dump(vendor)), 200

@bp.route('/vendors/<int:id>', methods=['PUT'])
@jwt_required()
def update_vendor(id):
    """Update a vendor"""
    vendor = Vendor.query.get_or_404(id)
    data = request.get_json()
    
    errors = vendor_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    for key, value in data.items():
        setattr(vendor, key, value)
    
    db.session.commit()
    return jsonify(vendor_schema.dump(vendor)), 200

@bp.route('/vendors/<int:vendor_id>/rate-schedules', methods=['POST'])
@jwt_required()
def create_rate_schedule(vendor_id):
    """Create a new rate schedule for a vendor"""
    vendor = Vendor.query.get_or_404(vendor_id)
    
    data = request.get_json()
    data['vendor_id'] = vendor_id
    errors = rate_schedule_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    rate_schedule = RateSchedule(**data)
    db.session.add(rate_schedule)
    db.session.commit()
    return jsonify(rate_schedule_schema.dump(rate_schedule)), 201

@bp.route('/vendors/<int:vendor_id>/rate-schedules', methods=['GET'])
@jwt_required()
def get_rate_schedules(vendor_id):
    """Get all rate schedules for a vendor"""
    Vendor.query.get_or_404(vendor_id)  # Verify vendor exists
    rate_schedules = RateSchedule.query.filter_by(vendor_id=vendor_id).all()
    return jsonify(rate_schedules_schema.dump(rate_schedules)), 200

@bp.route('/rate-schedules/<int:id>', methods=['GET'])
@jwt_required()
def get_rate_schedule(id):
    """Get a specific rate schedule"""
    rate_schedule = RateSchedule.query.get_or_404(id)
    return jsonify(rate_schedule_schema.dump(rate_schedule)), 200

@bp.route('/rate-schedules/<int:id>', methods=['PUT'])
@jwt_required()
def update_rate_schedule(id):
    """Update a rate schedule"""
    rate_schedule = RateSchedule.query.get_or_404(id)
    data = request.get_json()
    
    errors = rate_schedule_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    for key, value in data.items():
        if key != 'vendor_id':  # Prevent changing vendor
            setattr(rate_schedule, key, value)
    
    db.session.commit()
    return jsonify(rate_schedule_schema.dump(rate_schedule)), 200
