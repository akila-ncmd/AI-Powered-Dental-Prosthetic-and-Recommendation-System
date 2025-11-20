"""
AI Model Integration Testing
Tests YOLO model prediction and recommendation engine integration
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Database
from unittest.mock import patch, MagicMock
import tempfile
import os

class TestAIModel:
    """Test AI model integration"""

    @pytest.fixture
    def client(self):
        """Test client using real app"""
        return TestClient(app)

    def create_test_image(self):
        """Create a minimal valid JPEG file for testing"""
        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        # Write minimal JPEG header data
        jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'
        temp_file.write(jpeg_data)
        temp_file.close()
        return temp_file.name

    @patch('app.main.model.predict')
    def test_yolo_prediction_endpoint(self, mock_predict, client):
        """Test YOLO model prediction endpoint response"""
        # Mock YOLO prediction results
        mock_result = MagicMock()
        mock_result.names = {0: "Caries", 1: "Missing Teeth"}
        mock_boxes = MagicMock()
        mock_boxes.cls = [0, 1]  # Mock class indices
        mock_result.boxes = mock_boxes
        mock_predict.return_value = [mock_result]

        image_path = self.create_test_image()

        try:
            with open(image_path, 'rb') as f:
                response = client.post(
                    "/predict",
                    files={"file": ("test_xray.jpg", f, "image/jpeg")}
                )

            assert response.status_code == 200
            result = response.json()
            assert "detected_conditions" in result
            assert "output_image" in result
            assert isinstance(result["detected_conditions"], list)

            # Check that conditions are valid dental conditions
            valid_conditions = ["Caries", "Missing Teeth", "Bone Loss", "Periapical Lesion",
                              "Impacted Tooth", "Root Piece", "Crown", "Filling", "Implant"]
            for condition in result["detected_conditions"]:
                assert condition in valid_conditions

        finally:
            os.unlink(image_path)

    @patch('app.main.model.predict')
    def test_yolo_prediction_invalid_file(self, mock_predict, client):
        """Test YOLO prediction with invalid file"""
        # Mock YOLO to raise FileNotFoundError for invalid file
        mock_predict.side_effect = FileNotFoundError("This is not an image does not exist")

        # Test with text file
        temp_file = tempfile.NamedTemporaryFile(suffix='.txt', delete=False)
        temp_file.write(b"This is not an image")
        temp_file.close()

        try:
            with open(temp_file.name, 'rb') as f:
                response = client.post(
                    "/predict",
                    files={"file": ("test.txt", f, "text/plain")}
                )

            assert response.status_code == 400

        finally:
            os.unlink(temp_file.name)

    def test_yolo_prediction_no_file(self, client):
        """Test YOLO prediction without file"""
        response = client.post("/predict")
        assert response.status_code == 422  # Validation error

    def test_recommendation_engine_basic(self, client):
        """Test basic recommendation engine functionality"""
        if not Database.is_connected():
            pytest.skip("Database not connected")

        # Create test patient
        patient_data = {
            "name": "AI Test Patient",
            "nic": "AI123456789V",
            "age": 45,
            "gender": "Male",
            "budget": 100000
        }

        create_response = client.post("/patients", json=patient_data)
        assert create_response.status_code == 200
        patient_id = create_response.json()["id"]

        # Test recommendation generation
        rec_request = {
            "detected_conditions": ["Missing Teeth"]
        }

        response = client.post(f"/ai-recommendations/{patient_id}", json=rec_request)
        assert response.status_code == 200

        result = response.json()
        assert result["patient_id"] == patient_id
        assert "recommendations" in result
        assert len(result["recommendations"]) > 0

        # Check recommendation structure
        rec = result["recommendations"][0]
        required_fields = ["treatment", "cost_estimate", "suitability_score", "rationale"]
        for field in required_fields:
            assert field in rec

    def test_recommendation_engine_multiple_conditions(self, client):
        """Test recommendation engine with multiple conditions"""
        if not Database.is_connected():
            pytest.skip("Database not connected")

        # Create test patient
        patient_data = {
            "name": "Multi Condition Patient",
            "nic": "MULTI123456789V",
            "age": 50,
            "gender": "Female",
            "budget": 150000,
            "medical_conditions": ["Diabetes"]
        }

        create_response = client.post("/patients", json=patient_data)
        assert create_response.status_code == 200
        patient_id = create_response.json()["id"]

        # Test with multiple conditions
        rec_request = {
            "detected_conditions": ["Missing Teeth", "Bone Loss", "Caries"]
        }

        response = client.post(f"/ai-recommendations/{patient_id}", json=rec_request)
        assert response.status_code == 200

        result = response.json()
        assert len(result["recommendations"]) > 0

        # Verify recommendations consider medical conditions
        recommendations = result["recommendations"]
        for rec in recommendations:
            assert rec["suitability_score"] <= 100
            assert rec["suitability_score"] >= 0

    def test_recommendation_retrieval(self, client):
        """Test retrieving stored recommendations"""
        if not Database.is_connected():
            pytest.skip("Database not connected")

        # Create patient and generate recommendations first
        patient_data = {
            "name": "Retrieval Test Patient",
            "nic": "RETR123456789V",
            "age": 40,
            "gender": "Male",
            "budget": 80000
        }

        create_response = client.post("/patients", json=patient_data)
        assert create_response.status_code == 200
        patient_id = create_response.json()["id"]

        rec_request = {
            "detected_conditions": ["Missing Teeth"]
        }

        # Generate recommendations
        gen_response = client.post(f"/ai-recommendations/{patient_id}", json=rec_request)
        assert gen_response.status_code == 200

        # Retrieve recommendations
        response = client.get(f"/ai-recommendations/{patient_id}")
        assert response.status_code == 200

        result = response.json()
        assert "recommendations" in result
        assert len(result["recommendations"]) > 0

        # Check data persistence
        rec = result["recommendations"][0]
        assert "treatment" in rec
        assert "created_at" in rec

    @patch('app.main.model.predict')
    def test_ai_model_error_handling(self, mock_predict, client):
        """Test AI model error handling"""
        # Mock YOLO to raise ValueError for corrupted image
        mock_predict.side_effect = ValueError("need at least one array to stack")

        # Test with corrupted image data
        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        temp_file.write(b'corrupted image data')
        temp_file.close()

        try:
            with open(temp_file.name, 'rb') as f:
                response = client.post(
                    "/predict",
                    files={"file": ("corrupted.jpg", f, "image/jpeg")}
                )

            # Should handle gracefully
            assert response.status_code in [400, 500]

        finally:
            os.unlink(temp_file.name)

    def test_recommendation_invalid_patient(self, client):
        """Test recommendation generation with invalid patient"""
        rec_request = {
            "detected_conditions": ["Missing Teeth"]
        }

        response = client.post("/ai-recommendations/invalid_id", json=rec_request)
        # Should return 400 for invalid ObjectId or 500 for other validation errors
        assert response.status_code in [400, 500]

    def test_recommendation_empty_conditions(self, client):
        """Test recommendation with empty conditions"""
        if not Database.is_connected():
            pytest.skip("Database not connected")

        # Create patient
        patient_data = {
            "name": "Empty Conditions Patient",
            "nic": "EMPTY123456789V",
            "age": 35,
            "gender": "Female",
            "budget": 60000
        }

        create_response = client.post("/patients", json=patient_data)
        assert create_response.status_code == 200
        patient_id = create_response.json()["id"]

        # Test with empty conditions
        rec_request = {
            "detected_conditions": []
        }

        response = client.post(f"/ai-recommendations/{patient_id}", json=rec_request)
        # Should handle gracefully or provide default recommendations
        assert response.status_code in [200, 400]

    @patch('app.main.model.predict')
    def test_model_response_time(self, mock_predict, client):
        """Test AI model response time"""
        import time

        # Mock YOLO prediction results
        mock_result = MagicMock()
        mock_result.names = {0: "Caries"}
        mock_boxes = MagicMock()
        mock_boxes.cls = [0]
        mock_result.boxes = mock_boxes
        mock_predict.return_value = [mock_result]

        image_path = self.create_test_image()

        try:
            start_time = time.time()
            with open(image_path, 'rb') as f:
                response = client.post(
                    "/predict",
                    files={"file": ("timing_test.jpg", f, "image/jpeg")}
                )
            end_time = time.time()

            response_time = end_time - start_time

            # Should respond within reasonable time
            assert response_time < 5  # 5 seconds max for mocked response

        finally:
            os.unlink(image_path)

    def test_recommendation_data_integrity(self, client):
        """Test that recommendation data maintains integrity"""
        if not Database.is_connected():
            pytest.skip("Database not connected")

        # Create patient
        patient_data = {
            "name": "Integrity Test Patient",
            "nic": "INTEG123456789V",
            "age": 55,
            "gender": "Male",
            "budget": 200000,
            "medical_conditions": ["Hypertension", "Diabetes"]
        }

        create_response = client.post("/patients", json=patient_data)
        assert create_response.status_code == 200
        patient_id = create_response.json()["id"]

        # Generate recommendations
        rec_request = {
            "detected_conditions": ["Missing Teeth", "Bone Loss"]
        }

        response = client.post(f"/ai-recommendations/{patient_id}", json=rec_request)
        assert response.status_code == 200

        result = response.json()

        # Verify data integrity
        for rec in result["recommendations"]:
            assert isinstance(rec["suitability_score"], (int, float))
            assert 0 <= rec["suitability_score"] <= 100
            assert "treatment" in rec
            assert "rationale" in rec
            assert "cost_estimate" in rec