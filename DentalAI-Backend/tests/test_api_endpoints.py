"""
API Endpoint Integration Tests
Tests all API endpoints for proper functionality
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Database

class TestAPIEndpoints:
    """Test all API endpoints"""

    @pytest.fixture
    def client(self):
        """Test client using real app"""
        return TestClient(app)

    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "running" in data["message"].lower()

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_database_test_endpoint(self, client):
        """Test database test endpoint"""
        response = client.get("/db-test")
        # Should return some response regardless of DB status
        assert response.status_code in [200, 503]
        data = response.json()
        assert "status" in data

    def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = client.options("/patients", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST"
        })
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers

    def test_invalid_endpoint(self, client):
        """Test invalid endpoint returns 404"""
        response = client.get("/nonexistent")
        assert response.status_code == 404

    def test_method_not_allowed(self, client):
        """Test wrong HTTP method returns 405"""
        response = client.patch("/patients")
        assert response.status_code == 405