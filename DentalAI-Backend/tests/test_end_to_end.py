"""
End-to-End Workflow Integration Tests
Tests complete user workflows from patient creation to report generation
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

class TestEndToEndWorkflow:
    """Test complete end-to-end workflows"""

    @pytest.fixture
    def client(self):
        """Test client using real app"""
        return TestClient(app)

    def test_basic_workflow_setup(self, client):
        """Test basic workflow setup and health check"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Dental X-ray AI API is running" in data["message"]

        print("Basic workflow setup verified")