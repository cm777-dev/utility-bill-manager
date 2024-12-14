from flask import request, g
from flask_babel import Babel
from app import db
from app.models import User

babel = Babel()

def get_locale():
    # Try to get language from user settings
    if hasattr(g, 'current_user') and g.current_user and g.current_user.language:
        return g.current_user.language
    
    # Try to get language from request header
    header_lang = request.headers.get('Accept-Language')
    if header_lang:
        # Get the first language from the header
        lang = header_lang.split(',')[0].split(';')[0].split('-')[0]
        if lang in ['en', 'es', 'pt']:  # Add supported languages here
            return lang
    
    return 'en'  # Default language

def init_babel(app):
    babel.init_app(app, locale_selector=get_locale)
    
    # Add supported languages
    app.config['LANGUAGES'] = {
        'en': 'English',
        'es': 'Español',
        'pt': 'Português'
    }
    
    return babel
