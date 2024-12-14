from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User

bp = Blueprint('language', __name__)

@bp.route('/languages', methods=['GET'])
def get_languages():
    """Get list of supported languages"""
    return jsonify(current_app.config['LANGUAGES']), 200

@bp.route('/language', methods=['GET'])
@jwt_required()
def get_language():
    """Get current user's language preference"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify({
        'language': user.language,
        'available_languages': current_app.config['LANGUAGES']
    }), 200

@bp.route('/language', methods=['PUT'])
@jwt_required()
def update_language():
    """Update user's language preference"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    data = request.get_json()
    language = data.get('language')
    
    if not language:
        return jsonify({'error': 'Language is required'}), 400
        
    if language not in current_app.config['LANGUAGES']:
        return jsonify({'error': 'Unsupported language'}), 400
    
    user.language = language
    db.session.commit()
    
    return jsonify({
        'message': 'Language updated successfully',
        'language': language
    }), 200
