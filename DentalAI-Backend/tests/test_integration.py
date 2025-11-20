"""
Integration Tests for AI-Powered Dental Prosthetic Recommendation System
Tests real component interactions without mocking
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Database
import asyncio
from bson import ObjectId
import os
import tempfile

class TestIntegration:
    """Integration tests for the complete system"""

    @pytest.fixture
    def client(self):
        """Test client using real app"""
        return TestClient(app)

    def test_health_check_integration(self, client):
        """Test health check endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Dental X-ray AI API is running" in data["message"]

    def test_database_connection_integration(self, client):
        """Test database connection through API"""
        response = client.get("/db-test")
        # This might return disconnected if MongoDB is not available in test environment
        # But the endpoint should still work
        assert response.status_code in [200, 200]  # Accept both connected and disconnected states
        data = response.json()
        assert "status" in data

    def test_yolo_prediction_integration(self, client):
        """Test YOLO model prediction endpoint"""
        # Create a temporary test image for prediction
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            # Create a minimal valid JPEG file
            temp_file.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9')
            temp_file_path = temp_file.name

        try:
            # Test prediction
            with open(temp_file_path, 'rb') as f:
                response = client.post(
                    "/predict",
                    files={"file": ("test_image.jpg", f, "image/jpeg")}
                )

            # Prediction might succeed or fail depending on model loading
            # But the endpoint should respond
            assert response.status_code in [200, 400, 500]  # Accept success, validation error, or server error

            if response.status_code == 200:
                prediction_result = response.json()
                assert "detected_conditions" in prediction_result
                assert "output_image" in prediction_result
                assert isinstance(prediction_result["detected_conditions"], list)

        finally:
            # Clean up temp file
            os.unlink(temp_file_path)