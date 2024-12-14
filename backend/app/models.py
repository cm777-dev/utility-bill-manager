from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
from app import db
from app.security import validate_password, audit_log

class SecurityMixin:
    """Mixin for security-related fields and methods."""
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    @declared_attr
    def created_by_id(cls):
        return db.Column(db.Integer, db.ForeignKey('user.id'))
    
    @declared_attr
    def updated_by_id(cls):
        return db.Column(db.Integer, db.ForeignKey('user.id'))

class Organization(db.Model, SecurityMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    sites = db.relationship('Site', backref='organization', lazy='dynamic')

class Site(db.Model, SecurityMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey('organization.id'), nullable=False)
    address = db.Column(db.String(200))
    meters = db.relationship('Meter', backref='site', lazy='dynamic')

class CostCenter(db.Model, SecurityMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(50), unique=True)
    accounts = db.relationship('Account', backref='cost_center', lazy='dynamic')

class Account(db.Model, SecurityMixin):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(50), unique=True, nullable=False)
    cost_center_id = db.Column(db.Integer, db.ForeignKey('cost_center.id'), nullable=False)
    linked_meters = db.relationship('LinkedAccountMeter', backref='account', lazy='dynamic')

class Vendor(db.Model, SecurityMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(50), unique=True)
    rate_schedules = db.relationship('RateSchedule', backref='vendor', lazy='dynamic')

class RateSchedule(db.Model, SecurityMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendor.id'), nullable=False)
    effective_date = db.Column(db.Date, nullable=False)
    rate_type = db.Column(db.String(50))  # fixed, variable, tiered, etc.
    rate_details = db.Column(db.JSON)

class Meter(db.Model, SecurityMixin):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.String(50), nullable=False)
    site_id = db.Column(db.Integer, db.ForeignKey('site.id'), nullable=False)
    utility_type = db.Column(db.String(50), nullable=False)  # electricity, water, gas, etc.
    interval_data = db.relationship('IntervalData', backref='meter', lazy='dynamic')
    linked_accounts = db.relationship('LinkedAccountMeter', backref='meter', lazy='dynamic')

class LinkedAccountMeter(db.Model, SecurityMixin):
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    meter_id = db.Column(db.Integer, db.ForeignKey('meter.id'), nullable=False)
    rate_schedule_id = db.Column(db.Integer, db.ForeignKey('rate_schedule.id'))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)

class IntervalData(db.Model, SecurityMixin):
    id = db.Column(db.Integer, primary_key=True)
    meter_id = db.Column(db.Integer, db.ForeignKey('meter.id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)

class Bill(db.Model, SecurityMixin):
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

class BillAudit(db.Model, SecurityMixin):
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bill.id'), nullable=False)
    audit_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # passed, failed
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class User(db.Model, SecurityMixin):
    """User model with enhanced security features."""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(64), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey('organization.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, user, auditor
    language = db.Column(db.String(5), default='en')
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_login_attempt = db.Column(db.DateTime)
    account_locked_until = db.Column(db.DateTime)
    password_changed_at = db.Column(db.DateTime, default=func.now())
    mfa_secret = db.Column(db.String(32))
    mfa_enabled = db.Column(db.Boolean, default=False)
    api_key = db.Column(db.String(64), unique=True, index=True)
    api_key_expires_at = db.Column(db.DateTime)

    def set_password(self, password: str) -> tuple[bool, str]:
        """Set password with validation."""
        is_valid, message = validate_password(password)
        if not is_valid:
            return False, message
        
        self.password_hash = generate_password_hash(password)
        self.password_changed_at = func.now()
        return True, "Password set successfully"

    def check_password(self, password: str) -> bool:
        """Check password with rate limiting."""
        if self.account_locked_until and self.account_locked_until > datetime.utcnow():
            return False
            
        if self.last_login_attempt:
            time_diff = datetime.utcnow() - self.last_login_attempt
            if time_diff < timedelta(seconds=2):  # Rate limiting
                return False
        
        self.last_login_attempt = datetime.utcnow()
        
        if not check_password_hash(self.password_hash, password):
            self.failed_login_attempts += 1
            if self.failed_login_attempts >= 5:
                self.account_locked_until = datetime.utcnow() + timedelta(minutes=15)
            db.session.commit()
            return False
        
        self.failed_login_attempts = 0
        db.session.commit()
        return True

    def generate_api_key(self, expires_in_days: int = 30) -> str:
        """Generate a secure API key."""
        self.api_key = secrets.token_urlsafe(48)
        self.api_key_expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        return self.api_key

    def verify_api_key(self, api_key: str) -> bool:
        """Verify API key."""
        if not self.api_key or not self.api_key_expires_at:
            return False
        
        if datetime.utcnow() > self.api_key_expires_at:
            return False
            
        return secrets.compare_digest(self.api_key, api_key)

    def revoke_api_key(self) -> None:
        """Revoke API key."""
        self.api_key = None
        self.api_key_expires_at = None

    def to_dict(self) -> dict:
        """Convert to dictionary, excluding sensitive data."""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'organization_id': self.organization_id,
            'role': self.role,
            'language': self.language,
            'mfa_enabled': self.mfa_enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class AuditLog(db.Model):
    """Audit log for security events."""
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=func.now(), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    action = db.Column(db.String(50), nullable=False)
    resource = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(db.Integer)
    ip_address = db.Column(db.String(45))  # IPv6 support
    user_agent = db.Column(db.String(200))
    status = db.Column(db.String(20), nullable=False)
    details = db.Column(db.Text)

    @classmethod
    def log(cls, user_id: Optional[int], action: str, resource: str,
            resource_id: Optional[int], ip_address: str, user_agent: str,
            status: str, details: Optional[str] = None) -> None:
        """Create an audit log entry."""
        log_entry = cls(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            details=details
        )
        db.session.add(log_entry)
        db.session.commit()

class ExportLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bill.id'), nullable=False)
    export_type = db.Column(db.String(50))  # AP, GL
    status = db.Column(db.String(20))  # success, failed
    file_path = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
