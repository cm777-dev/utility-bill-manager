from datetime import datetime
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class Organization(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sites = db.relationship('Site', backref='organization', lazy='dynamic')

class Site(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey('organization.id'), nullable=False)
    address = db.Column(db.String(200))
    meters = db.relationship('Meter', backref='site', lazy='dynamic')

class CostCenter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(50), unique=True)
    accounts = db.relationship('Account', backref='cost_center', lazy='dynamic')

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(50), unique=True, nullable=False)
    cost_center_id = db.Column(db.Integer, db.ForeignKey('cost_center.id'), nullable=False)
    linked_meters = db.relationship('LinkedAccountMeter', backref='account', lazy='dynamic')

class Vendor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(50), unique=True)
    rate_schedules = db.relationship('RateSchedule', backref='vendor', lazy='dynamic')

class RateSchedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), nullable=False)
    effective_date = db.Column(db.Date, nullable=False)
    rate_type = db.Column(db.String(50))  # fixed, variable, tiered, etc.
    rate_details = db.Column(db.JSON)

class Meter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(50), nullable=False)
    site_id = db.Column(db.Integer, db.ForeignKey('site.id'), nullable=False)
    utility_type = db.Column(db.String(50), nullable=False)  # electricity, water, gas, etc.
    interval_data = db.relationship('IntervalData', backref='meter', lazy='dynamic')
    linked_accounts = db.relationship('LinkedAccountMeter', backref='meter', lazy='dynamic')

class LinkedAccountMeter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    meter_id = db.Column(db.Integer, db.ForeignKey('meter.id'), nullable=False)
    rate_schedule_id = db.Column(db.Integer, db.ForeignKey('rate_schedule.id'))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)

class IntervalData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    meter_id = db.Column(db.Integer, db.ForeignKey('meter.id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)

class Bill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    linked_account_meter_id = db.Column(db.Integer, db.ForeignKey('linked_account_meter.id'), nullable=False)
    bill_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    source_type = db.Column(db.String(50))  # manual, import, EDI, XML, Excel
    file_path = db.Column(db.String(200))  # path to bill file/image
    usage_amount = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    audits = db.relationship('BillAudit', backref='bill', lazy='dynamic')

class BillAudit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bill.id'), nullable=False)
    audit_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # passed, failed
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    name = db.Column(db.String(64))
    organization_id = db.Column(db.Integer, db.ForeignKey('organization.id'))
    role = db.Column(db.String(20))  # admin, user, auditor
    language = db.Column(db.String(5), default='en')  # e.g., 'en', 'es', 'pt'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class ExportLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bill.id'), nullable=False)
    export_type = db.Column(db.String(50))  # AP, GL
    status = db.Column(db.String(20))  # success, failed
    file_path = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
