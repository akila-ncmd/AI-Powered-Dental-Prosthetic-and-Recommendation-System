import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from app.routes.patients import router
from unittest.mock import patch, MagicMock
from fastapi.encoders import jsonable_encoder
from bson import ObjectId

# Monkey patch the jsonable_encoder to handle ObjectId
import fastapi.encoders

original_jsonable_encoder = fastapi.encoders.jsonable_encoder

def patched_jsonable_encoder(obj, *args, **kwargs):
    if isinstance(obj, ObjectId):
        return str(obj)
    return original_jsonable_encoder(obj, *args, **kwargs)

fastapi.encoders.jsonable_encoder = patched_jsonable_encoder

class TestPatientRoutes:
    """Test cases for patient API routes"""

    @pytest.fixture
    def app(self):
        """Use main FastAPI app with custom ObjectId encoder"""
        from app.main import app
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return TestClient(app)

    @patch('app.database.Database.get_database')
    def test_create_patient_success(self, mock_get_db, client):
        """Test successful patient creation"""
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.patients = mock_collection

        # Create an async mock for insert_one
        async def mock_insert_one(*args, **kwargs):
            return MagicMock(inserted_id="507f1f77bcf86cd799439011")

        mock_collection.insert_one = mock_insert_one
        mock_get_db.return_value = mock_db

        patient_data = {
            "name": "John Doe",
            "nic": "123456789V",
            "age": 35,
            "gender": "Male",
            "budget": 50000
        }

        response = client.post("/patients", json=patient_data)

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Patient created successfully"
        assert "id" in data
        assert data["id"] == "507f1f77bcf86cd799439011"

    @patch('app.database.Database.get_database')
    def test_get_patient_success(self, mock_get_db, client):
        """Test successful patient retrieval"""
        from bson import ObjectId

        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.patients = mock_collection

        patient_id = "507f1f77bcf86cd799439011"
        patient_data = {
            "_id": ObjectId(patient_id),
            "name": "John Doe",
            "nic": "123456789V",
            "age": 35,
            "gender": "Male",
            "budget": 50000
        }

        # Create an async mock for find_one
        async def mock_find_one(*args, **kwargs):
            return patient_data

        mock_collection.find_one = mock_find_one
        mock_get_db.return_value = mock_db

        response = client.get(f"/patients/{patient_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "John Doe"
        assert data["age"] == 35
        assert data["id"] == patient_id

    @patch('app.database.Database.get_database')
    def test_get_patient_not_found(self, mock_get_db, client):
        """Test patient not found scenario"""
        from bson import ObjectId

        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.patients = mock_collection

        # Create an async mock for find_one that returns None
        async def mock_find_one(*args, **kwargs):
            return None

        mock_collection.find_one = mock_find_one
        mock_get_db.return_value = mock_db

        patient_id = "507f1f77bcf86cd799439011"
        response = client.get(f"/patients/{patient_id}")

        assert response.status_code == 404
        data = response.json()
        assert data["detail"] == "Patient not found"

    def test_get_patient_invalid_id(self, client):
        """Test invalid patient ID format"""
        response = client.get("/patients/invalid@id")

        assert response.status_code == 400
        data = response.json()
        assert "invalid" in data["detail"].lower()

    @patch('app.database.Database.get_database')
    def test_get_all_patients(self, mock_get_db, client):
        """Test retrieving all patients"""
        from bson import ObjectId

        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.patients = mock_collection

        # Mock raw MongoDB documents (before route processing)
        raw_patients = [
            {
                "_id": ObjectId("507f1f77bcf86cd799439011"),
                "name": "Patient 1",
                "age": 30
            },
            {
                "_id": ObjectId("507f191e810c19729de860ea"),
                "name": "Patient 2",
                "age": 40
            }
        ]

        # Mock async iteration over raw documents
        async def mock_async_iter():
            for patient in raw_patients:
                yield patient

        mock_collection.find.return_value = mock_async_iter()
        mock_get_db.return_value = mock_db

        response = client.get("/patients")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "Patient 1"
        assert data[0]["id"] == "507f1f77bcf86cd799439011"
        assert data[1]["name"] == "Patient 2"
        assert data[1]["id"] == "507f191e810c19729de860ea"