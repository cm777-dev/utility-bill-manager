"""Security middleware for the application."""
from functools import wraps
from flask import request, g, jsonify, current_app
from werkzeug.utils import secure_filename
import hashlib
import hmac
import time
import re
from typing import Callable, Any, Optional
from .utils import validate_url, sanitize_input
from ..models import User, AuditLog

def require_api_key(f: Callable) -> Callable:
    """Decorator to require API key for access."""
    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            AuditLog.log(None, 'api_access', 'api', None, request.remote_addr,
                        request.user_agent.string, 'failed', 'Missing API key')
            return jsonify({'error': 'API key is required'}), 401

        user = User.query.filter_by(api_key=api_key).first()
        if not user or not user.verify_api_key(api_key):
            AuditLog.log(None, 'api_access', 'api', None, request.remote_addr,
                        request.user_agent.string, 'failed', 'Invalid API key')
            return jsonify({'error': 'Invalid API key'}), 401

        g.current_user = user
        return f(*args, **kwargs)
    return decorated

def validate_content_type(content_types: list[str]) -> Callable:
    """Decorator to validate Content-Type header."""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            if request.content_type not in content_types:
                return jsonify({
                    'error': f'Content-Type must be one of: {", ".join(content_types)}'
                }), 415
            return f(*args, **kwargs)
        return decorated
    return decorator

def validate_file_upload(allowed_extensions: set[str], max_size_mb: int = 10) -> Callable:
    """Decorator to validate file uploads."""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            if 'file' not in request.files:
                return jsonify({'error': 'No file provided'}), 400

            file = request.files['file']
            if not file.filename:
                return jsonify({'error': 'No file selected'}), 400

            # Check file extension
            if not ('.' in file.filename and
                   file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
                return jsonify({'error': 'Invalid file type'}), 400

            # Check file size
            file.seek(0, 2)  # Seek to end of file
            size_mb = file.tell() / (1024 * 1024)
            file.seek(0)  # Reset file pointer
            if size_mb > max_size_mb:
                return jsonify({'error': f'File size exceeds {max_size_mb}MB limit'}), 400

            # Sanitize filename
            file.filename = secure_filename(file.filename)
            
            return f(*args, **kwargs)
        return decorated
    return decorator

def rate_limit(requests: int, window: int) -> Callable:
    """Decorator for rate limiting based on IP address."""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            ip = request.remote_addr
            current = time.time()
            key = f'rate_limit:{ip}:{f.__name__}'
            
            # Use Redis for rate limiting
            pipe = current_app.redis.pipeline()
            pipe.zremrangebyscore(key, 0, current - window)
            pipe.zcard(key)
            pipe.zadd(key, {str(current): current})
            pipe.expire(key, window)
            results = pipe.execute()
            
            if results[1] >= requests:
                AuditLog.log(getattr(g, 'current_user', {}).get('id'), 
                           'rate_limit', 'api', None, ip,
                           request.user_agent.string, 'blocked',
                           f'Rate limit exceeded: {requests} requests per {window}s')
                return jsonify({'error': 'Rate limit exceeded'}), 429
                
            return f(*args, **kwargs)
        return decorated
    return decorator

def validate_json_payload(*required_fields: str) -> Callable:
    """Decorator to validate JSON payload."""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 415
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'Invalid JSON payload'}), 400
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400
                
            # Sanitize input fields
            for field in data:
                if isinstance(data[field], str):
                    data[field] = sanitize_input(data[field])
            
            return f(*args, **kwargs)
        return decorated
    return decorator

def verify_webhook_signature(f: Callable) -> Callable:
    """Decorator to verify webhook signatures."""
    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        signature = request.headers.get('X-Webhook-Signature')
        if not signature:
            return jsonify({'error': 'Missing webhook signature'}), 401

        # Get raw request body
        payload = request.get_data()
        
        # Calculate expected signature
        secret = current_app.config['WEBHOOK_SECRET']
        expected = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected):
            AuditLog.log(None, 'webhook', 'api', None, request.remote_addr,
                        request.user_agent.string, 'failed',
                        'Invalid webhook signature')
            return jsonify({'error': 'Invalid webhook signature'}), 401
            
        return f(*args, **kwargs)
    return decorated

def sanitize_response(f: Callable) -> Callable:
    """Decorator to sanitize response data."""
    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        response = f(*args, **kwargs)
        
        if isinstance(response, tuple):
            data, code = response
        else:
            data, code = response, 200
            
        # Recursively sanitize response data
        def sanitize_dict(d: dict) -> dict:
            for key, value in d.items():
                if isinstance(value, str):
                    d[key] = sanitize_input(value)
                elif isinstance(value, dict):
                    d[key] = sanitize_dict(value)
                elif isinstance(value, list):
                    d[key] = [sanitize_dict(i) if isinstance(i, dict)
                             else sanitize_input(i) if isinstance(i, str)
                             else i for i in value]
            return d
            
        if isinstance(data, dict):
            data = sanitize_dict(data)
            
        return (data, code) if isinstance(response, tuple) else data
    return decorated

def validate_url_parameters(*allowed_params: str) -> Callable:
    """Decorator to validate URL parameters."""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            # Check for invalid parameters
            invalid_params = set(request.args.keys()) - set(allowed_params)
            if invalid_params:
                return jsonify({
                    'error': f'Invalid URL parameters: {", ".join(invalid_params)}'
                }), 400
            
            # Sanitize parameter values
            for param in request.args:
                value = request.args.get(param)
                if value:
                    # Check for common injection patterns
                    if re.search(r'[<>]|javascript:|data:|vbscript:', value, re.I):
                        return jsonify({
                            'error': f'Invalid characters in parameter: {param}'
                        }), 400
                    
                    # Validate URLs if present
                    if 'url' in param.lower() and not validate_url(value):
                        return jsonify({
                            'error': f'Invalid URL in parameter: {param}'
                        }), 400
            
            return f(*args, **kwargs)
        return decorated
    return decorator
