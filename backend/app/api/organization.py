from flask import Blueprint, request, jsonify
from app import db
from app.models import Organization, Site, CostCenter, Account
from app.schemas import (
    OrganizationSchema, SiteSchema, CostCenterSchema, AccountSchema
)
from flask_jwt_extended import jwt_required

bp = Blueprint('organization', __name__)

# Initialize schemas
org_schema = OrganizationSchema()
orgs_schema = OrganizationSchema(many=True)
site_schema = SiteSchema()
sites_schema = SiteSchema(many=True)
cost_center_schema = CostCenterSchema()
cost_centers_schema = CostCenterSchema(many=True)
account_schema = AccountSchema()
accounts_schema = AccountSchema(many=True)

# Organization endpoints
@bp.route('/organizations', methods=['POST'])
@jwt_required()
def create_organization():
    """Create a new organization"""
    data = request.get_json()
    errors = org_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    org = Organization(**data)
    db.session.add(org)
    db.session.commit()
    return jsonify(org_schema.dump(org)), 201

@bp.route('/organizations', methods=['GET'])
@jwt_required()
def get_organizations():
    """Get all organizations"""
    orgs = Organization.query.all()
    return jsonify(orgs_schema.dump(orgs)), 200

@bp.route('/organizations/<int:id>', methods=['GET'])
@jwt_required()
def get_organization(id):
    """Get a specific organization"""
    org = Organization.query.get_or_404(id)
    return jsonify(org_schema.dump(org)), 200

# Site endpoints
@bp.route('/organizations/<int:org_id>/sites', methods=['POST'])
@jwt_required()
def create_site(org_id):
    """Create a new site for an organization"""
    org = Organization.query.get_or_404(org_id)
    
    data = request.get_json()
    data['organization_id'] = org_id
    errors = site_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    site = Site(**data)
    db.session.add(site)
    db.session.commit()
    return jsonify(site_schema.dump(site)), 201

@bp.route('/organizations/<int:org_id>/sites', methods=['GET'])
@jwt_required()
def get_sites(org_id):
    """Get all sites for an organization"""
    Organization.query.get_or_404(org_id)  # Verify org exists
    sites = Site.query.filter_by(organization_id=org_id).all()
    return jsonify(sites_schema.dump(sites)), 200

# Cost Center endpoints
@bp.route('/cost-centers', methods=['POST'])
@jwt_required()
def create_cost_center():
    """Create a new cost center"""
    data = request.get_json()
    errors = cost_center_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    cost_center = CostCenter(**data)
    db.session.add(cost_center)
    db.session.commit()
    return jsonify(cost_center_schema.dump(cost_center)), 201

@bp.route('/cost-centers', methods=['GET'])
@jwt_required()
def get_cost_centers():
    """Get all cost centers"""
    cost_centers = CostCenter.query.all()
    return jsonify(cost_centers_schema.dump(cost_centers)), 200

# Account endpoints
@bp.route('/cost-centers/<int:cost_center_id>/accounts', methods=['POST'])
@jwt_required()
def create_account(cost_center_id):
    """Create a new account for a cost center"""
    cost_center = CostCenter.query.get_or_404(cost_center_id)
    
    data = request.get_json()
    data['cost_center_id'] = cost_center_id
    errors = account_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 400

    account = Account(**data)
    db.session.add(account)
    db.session.commit()
    return jsonify(account_schema.dump(account)), 201

@bp.route('/cost-centers/<int:cost_center_id>/accounts', methods=['GET'])
@jwt_required()
def get_accounts(cost_center_id):
    """Get all accounts for a cost center"""
    CostCenter.query.get_or_404(cost_center_id)  # Verify cost center exists
    accounts = Account.query.filter_by(cost_center_id=cost_center_id).all()
    return jsonify(accounts_schema.dump(accounts)), 200
