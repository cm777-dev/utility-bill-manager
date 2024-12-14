from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from config import Config
from .celery_app import create_celery_app
from .translations import init_babel
from .security import init_security, SecurityConfig, audit_log

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
ma = Marshmallow()
limiter = Limiter(key_func=get_remote_address)
celery = None

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize security features
    init_security(app)
    
    # Initialize Talisman for security headers
    Talisman(app,
             force_https=True,
             strict_transport_security=True,
             session_cookie_secure=True,
             content_security_policy=SecurityConfig.SECURITY_HEADERS['Content-Security-Policy'])
    
    # Initialize rate limiting
    limiter.init_app(app)
    
    # Initialize database
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Initialize JWT with security configurations
    jwt.init_app(app)
    
    # Initialize CORS with security configurations
    CORS(app,
         resources={r"/api/*": {"origins": SecurityConfig.CORS_ORIGINS,
                               "methods": SecurityConfig.CORS_METHODS,
                               "allow_headers": SecurityConfig.CORS_ALLOWED_HEADERS}},
         supports_credentials=True)
    
    # Initialize Marshmallow
    ma.init_app(app)
    
    # Initialize translations
    init_babel(app)

    # Initialize Celery
    global celery
    celery = create_celery_app(app)

    # Register error handlers
    @app.errorhandler(400)
    def bad_request_error(error):
        audit_log("error", "system", "error", f"Bad Request: {str(error)}")
        return {"error": "Bad Request", "message": str(error)}, 400

    @app.errorhandler(401)
    def unauthorized_error(error):
        audit_log("error", "system", "error", f"Unauthorized: {str(error)}")
        return {"error": "Unauthorized", "message": str(error)}, 401

    @app.errorhandler(403)
    def forbidden_error(error):
        audit_log("error", "system", "error", f"Forbidden: {str(error)}")
        return {"error": "Forbidden", "message": str(error)}, 403

    @app.errorhandler(404)
    def not_found_error(error):
        audit_log("error", "system", "error", f"Not Found: {str(error)}")
        return {"error": "Not Found", "message": str(error)}, 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        audit_log("error", "system", "error", f"Internal Server Error: {str(error)}")
        return {"error": "Internal Server Error", "message": "An unexpected error has occurred"}, 500

    # Register blueprints
    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    from app.api.bills import bp as bills_bp
    app.register_blueprint(bills_bp, url_prefix='/api')

    from app.api.organization import bp as org_bp
    app.register_blueprint(org_bp, url_prefix='/api')

    from app.api.vendors import bp as vendors_bp
    app.register_blueprint(vendors_bp, url_prefix='/api')

    from app.api.language import bp as language_bp
    app.register_blueprint(language_bp, url_prefix='/api')

    # Create upload directory if it doesn't exist
    import os
    if not os.path.exists('uploads'):
        os.makedirs('uploads')

    return app

from app import models
