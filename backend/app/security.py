"""Security configuration and utilities for the application."""
from functools import wraps
from flask import current_app, request, jsonify, g
from flask_jwt_extended import get_jwt, verify_jwt_in_request
import re
from werkzeug.security import safe_str_cmp
import secrets
import logging
from typing import Optional, Callable, Any
from datetime import datetime, timezone
import bleach
from urllib.parse import urlparse
from .security.encryption import DataEncryption, FieldEncryption, SecureTokenGenerator
from .security.file_handler import SecureFileHandler
from .models import AuditLog

# Configure logging with secure settings
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('security.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

class SecurityConfig:
    """Security configuration settings."""
    # Password policy
    MIN_PASSWORD_LENGTH = 12
    PASSWORD_PATTERN = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$'
    MAX_PASSWORD_AGE = 90  # days
    PASSWORD_HISTORY_SIZE = 5
    
    # Session security
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 days
    JWT_COOKIE_SECURE = True
    JWT_COOKIE_SAMESITE = 'Strict'
    
    # CORS settings
    CORS_ORIGINS = ['https://yourdomain.com']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_ALLOWED_HEADERS = ['Content-Type', 'Authorization']
    
    # File upload settings
    ALLOWED_EXTENSIONS = {'pdf', 'xlsx', 'xls', 'csv', 'xml'}
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB
    
    # Rate limiting
    RATELIMIT_DEFAULT = "100/hour"
    RATELIMIT_STORAGE_URL = "redis://redis:6379/0"
    
    # Security headers
    SECURITY_HEADERS = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; script-src 'self'"
    }
    
    # Encryption settings
    ENCRYPTION_KEY_ROTATION = 30  # days
    FILE_ENCRYPTION_ENABLED = True
    FIELD_ENCRYPTION_ENABLED = True
    
    # API security
    API_KEY_EXPIRY = 30  # days
    API_RATE_LIMIT = "1000/day"
    
    # Audit settings
    AUDIT_LOG_RETENTION = 365  # days
    AUDIT_SENSITIVE_FIELDS = {'password', 'token', 'key', 'secret'}

def init_security(app):
    """Initialize security configurations."""
    # Set security-related configurations
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = SecurityConfig.JWT_ACCESS_TOKEN_EXPIRES
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = SecurityConfig.JWT_REFRESH_TOKEN_EXPIRES
    app.config['JWT_COOKIE_SECURE'] = SecurityConfig.JWT_COOKIE_SECURE
    app.config['JWT_COOKIE_SAMESITE'] = SecurityConfig.JWT_COOKIE_SAMESITE
    app.config['MAX_CONTENT_LENGTH'] = SecurityConfig.MAX_CONTENT_LENGTH
    
    # Initialize encryption services
    app.data_encryption = DataEncryption()
    app.field_encryption = FieldEncryption()
    app.secure_file_handler = SecureFileHandler()
    app.token_generator = SecureTokenGenerator()
    
    # Register security middleware
    @app.after_request
    def add_security_headers(response):
        """Add security headers to all responses."""
        for header, value in SecurityConfig.SECURITY_HEADERS.items():
            if header not in response.headers:
                response.headers[header] = value
        return response
    
    @app.before_request
    def validate_content_type():
        """Validate Content-Type header for requests with body."""
        if request.method in ['POST', 'PUT'] and not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 415
    
    @app.before_request
    def check_file_size():
        """Check file size before processing."""
        if request.content_length and request.content_length > SecurityConfig.MAX_CONTENT_LENGTH:
            return jsonify({'error': 'File too large'}), 413

def audit_log(action: str, resource: str, status: str, details: Optional[str] = None) -> None:
    """Log security-relevant actions."""
    user_id = getattr(g, 'current_user', {}).get('id', 'anonymous')
    timestamp = datetime.now(timezone.utc).isoformat()
    ip_address = request.remote_addr
    
    # Mask sensitive data in details
    if details and isinstance(details, str):
        for field in SecurityConfig.AUDIT_SENSITIVE_FIELDS:
            pattern = rf'{field}["\']?\s*[:=]\s*["\']?([^"\'\s]+)["\']?'
            details = re.sub(pattern, f'{field}=*****', details)
    
    log_data = {
        'timestamp': timestamp,
        'user_id': user_id,
        'ip_address': ip_address,
        'action': action,
        'resource': resource,
        'status': status,
        'details': details,
        'user_agent': request.user_agent.string if request.user_agent else None
    }
    
    logger.info('Security Audit: %s', log_data)
    
    # Store in database
    AuditLog.log(
        user_id=user_id,
        action=action,
        resource=resource,
        resource_id=None,
        ip_address=ip_address,
        user_agent=request.user_agent.string if request.user_agent else None,
        status=status,
        details=details
    )

def validate_url(url: str) -> bool:
    """Validate URL to prevent SSRF attacks."""
    try:
        parsed = urlparse(url)
        return all([
            parsed.scheme in ['http', 'https'],
            not parsed.netloc.startswith('127.'),
            not parsed.netloc.startswith('169.254.'),
            not parsed.netloc.startswith('10.'),
            not parsed.netloc.startswith('172.16.'),
            not parsed.netloc.startswith('192.168.'),
            not parsed.netloc.startswith('localhost'),
            not parsed.netloc.endswith('.local')
        ])
    except Exception:
        return False

def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS attacks."""
    return bleach.clean(
        text,
        tags=[],
        attributes={},
        protocols=['http', 'https', 'mailto'],
        strip=True,
        strip_comments=True
    )

def compare_secure_strings(a: str, b: str) -> bool:
    """Compare strings in constant time to prevent timing attacks."""
    return safe_str_cmp(a.encode('utf-8'), b.encode('utf-8'))
