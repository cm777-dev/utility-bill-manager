import pytest
from app import create_app
from models import db as _db
import os

@pytest.fixture
def app():
    app = create_app('testing')
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def db(app):
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json == {'status': 'healthy'}

def test_login_required(client):
    response = client.get('/api/bills')
    assert response.status_code == 401

def test_register_user(client, db):
    response = client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'testpass123',
        'name': 'Test User'
    })
    assert response.status_code == 201
    assert 'token' in response.json

def test_login_user(client, db):
    # First register a user
    client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'testpass123',
        'name': 'Test User'
    })
    
    # Then try to login
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'testpass123'
    })
    assert response.status_code == 200
    assert 'token' in response.json
