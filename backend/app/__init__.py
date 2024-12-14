from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from config import Config
from .celery_app import create_celery_app
from .translations import init_babel

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
ma = Marshmallow()
celery = None

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)
    ma.init_app(app)
    
    # Initialize translations
    init_babel(app)

    # Initialize Celery
    global celery
    celery = create_celery_app(app)

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

    # Create database tables
    with app.app_context():
        db.create_all()

    return app

from app import models
