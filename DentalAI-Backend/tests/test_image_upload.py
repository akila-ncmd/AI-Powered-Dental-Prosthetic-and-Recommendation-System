"""
Image Upload and Processing Integration Tests
Tests image upload, storage, and processing functionality
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Database
from unittest.mock import patch, MagicMock, AsyncMock
from bson import ObjectId
import tempfile
import os

class TestImageUpload:
    """Test image upload and processing functionality"""

    @pytest.fixture
    def client(self):
        """Test client using real app"""
        return TestClient(app)

    def create_test_patient(self, client):
        """Helper to create a test patient"""
        patient_data = {
            "name": "Image Test Patient",
            "nic": "IMG123456789V",
            "age": 35,
            "gender": "Male",
            "budget": 50000
        }

        response = client.post("/patients", json=patient_data)
        assert response.status_code == 200
        return response.json()["id"]

    def create_test_image(self):
        """Create a minimal valid JPEG file for testing"""
        # Create a temporary file with minimal JPEG data
        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        # Write minimal JPEG header data
        jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'
        temp_file.write(jpeg_data)
        temp_file.close()
        return temp_file.name

    @patch('app.main.Database.get_database')
    @patch('app.main.Database.is_connected', return_value=True)
    def test_image_upload_success(self, mock_is_connected, mock_get_database, client):
        """Test successful image upload with mocked database"""
        # Mock the database
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.patients = mock_collection
        mock_db.images = mock_collection

        # Mock async operations
        mock_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id="507f1f77bcf86cd799439011"))
        mock_collection.find_one = AsyncMock(return_value={"_id": "patient123"})  # Mock patient exists

        mock_get_database.return_value = mock_db

        patient_id = "507f1f77bcf86cd799439011"

        # Create test image
        image_path = self.create_test_image()

        try:
            # Upload the image
            with open(image_path, 'rb') as f:
                response = client.post(
                    f"/images/upload/{patient_id}",
                    files={"file": ("test_xray.jpg", f, "image/jpeg")}
                )

            assert response.status_code == 200
            result = response.json()

            # Verify response structure (Image model response)
            assert "_id" in result
            assert result["patient_id"] == patient_id
            assert result["filename"] == "test_xray.jpg"
            assert "file_path" in result
            assert "file_size" in result
            assert result["mime_type"] == "image/jpeg"
            assert result["image_type"] == "original"

        finally:
            # Clean up test file
            os.unlink(image_path)

    def test_image_upload_invalid_patient(self, client):
        """Test image upload with invalid patient ID"""
        image_path = self.create_test_image()

        try:
            with open(image_path, 'rb') as f:
                response = client.post(
                    "/images/upload/invalid_patient_id",
                    files={"file": ("test.jpg", f, "image/jpeg")}
                )

            if Database.is_connected():
                assert response.status_code == 400
            else:
                # Database not available - returns 503 before ID validation
                assert response.status_code == 503

        finally:
            os.unlink(image_path)

    @patch('app.main.Database.get_database')
    @patch('app.main.Database.is_connected', return_value=True)
    def test_image_upload_no_file(self, mock_is_connected, mock_get_database, client):
        """Test image upload without file with mocked database"""
        # Mock the database
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.patients = mock_collection
        mock_collection.find_one.return_value = {"_id": "patient123"}  # Mock patient exists
        mock_get_database.return_value = mock_db

        patient_id = "507f1f77bcf86cd799439011"

        response = client.post(f"/images/upload/{patient_id}")
        assert response.status_code == 422  # Validation error

    @patch('app.main.Database.get_database')
    @patch('app.main.Database.is_connected', return_value=True)
    def test_image_upload_invalid_file_type(self, mock_is_connected, mock_get_database, client):
        """Test image upload with invalid file type with mocked database"""
        # Mock the database
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.patients = mock_collection
        mock_collection.find_one = AsyncMock(return_value={"_id": "patient123"})  # Mock patient exists
        mock_get_database.return_value = mock_db

        patient_id = "507f1f77bcf86cd799439011"

        # Create a text file instead of image
        temp_file = tempfile.NamedTemporaryFile(suffix='.txt', delete=False)
        temp_file.write(b"This is not an image file")
        temp_file.close()

        try:
            with open(temp_file.name, 'rb') as f:
                response = client.post(
                    f"/images/upload/{patient_id}",
                    files={"file": ("test.txt", f, "text/plain")}
                )

            assert response.status_code == 400
            error_data = response.json()
            assert "image" in error_data["detail"].lower()

        finally:
            os.unlink(temp_file.name)

    @patch('app.main.Database.get_database')
    @patch('app.main.Database.is_connected', return_value=True)
    def test_get_patient_images(self, mock_is_connected, mock_get_database, client):
        """Test retrieving images for a patient with mocked database"""
        # Mock the database
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.images = mock_collection

        patient_id = "507f1f77bcf86cd799439011"

        # Mock image data with required fields for Image model
        image_docs = [
            {
                "_id": ObjectId("507f1f77bcf86cd799439011"),
                "patient_id": ObjectId(patient_id),
                "filename": "test.jpg",
                "file_path": "/uploads/test.jpg",
                "uploaded_at": "2025-01-01T00:00:00Z",
                "image_type": "original",
                "file_size": 1024,
                "mime_type": "image/jpeg",
                "width": 100,
                "height": 100
            }
        ]

        async def mock_find():
            for doc in image_docs:
                yield doc

        mock_collection.find.return_value = mock_find()
        mock_get_database.return_value = mock_db

        # Retrieve images
        response = client.get(f"/images/{patient_id}")
        assert response.status_code == 200

        images = response.json()
        assert isinstance(images, list)
        assert len(images) >= 1

        # Check image structure
        image = images[0]
        required_fields = ["_id", "patient_id", "filename", "file_path", "uploaded_at"]
        for field in required_fields:
            assert field in image

    def test_get_images_invalid_patient(self, client):
        """Test getting images for invalid patient"""
        response = client.get("/images/invalid_patient_id")
        if Database.is_connected():
            assert response.status_code == 400
        else:
            # Database not available - returns 503 before ID validation
            assert response.status_code == 503

    @patch('app.main.Database.get_database')
    @patch('app.main.Database.is_connected', return_value=True)
    def test_get_images_nonexistent_patient(self, mock_is_connected, mock_get_database, client):
        """Test getting images for non-existent patient"""
        # Mock the database
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.images = mock_collection

        # Mock empty async iterator (no images found)
        async def empty_async_iter():
            return
            yield  # Empty generator

        mock_collection.find.return_value = empty_async_iter()
        mock_get_database.return_value = mock_db

        response = client.get("/images/507f1f77bcf86cd799439011")  # Valid ObjectId format
        assert response.status_code == 200  # Should return empty list, not 404
        images = response.json()
        assert isinstance(images, list)
        assert len(images) == 0

    @patch('app.main.Database.get_database')
    @patch('app.main.Database.is_connected', return_value=True)
    def test_image_file_storage(self, mock_is_connected, mock_get_database, client):
        """Test that uploaded images are properly stored with mocked database"""
        # Mock the database
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.patients = mock_collection
        mock_db.images = mock_collection

        mock_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id="507f1f77bcf86cd799439011"))
        mock_collection.find_one = AsyncMock(return_value={"_id": "patient123"})  # Mock patient exists
        mock_get_database.return_value = mock_db

        patient_id = "507f1f77bcf86cd799439011"
        image_path = self.create_test_image()

        try:
            with open(image_path, 'rb') as f:
                response = client.post(
                    f"/images/upload/{patient_id}",
                    files={"file": ("storage_test.jpg", f, "image/jpeg")}
                )

            assert response.status_code == 200
            result = response.json()

            # Check if file exists on server (this will actually create the file)
            stored_path = result["file_path"]
            assert os.path.exists(stored_path)

            # Verify file size
            stored_size = os.path.getsize(stored_path)
            assert stored_size > 0

        finally:
            os.unlink(image_path)
            # Clean up stored file if it was created
            if 'result' in locals() and os.path.exists(result["file_path"]):
                os.unlink(result["file_path"])

    @patch('app.main.Database.get_database')
    @patch('app.main.Database.is_connected', return_value=True)
    def test_multiple_image_upload(self, mock_is_connected, mock_get_database, client):
        """Test uploading multiple images for same patient with mocked database"""
        # Mock the database
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.patients = mock_collection
        mock_db.images = mock_collection

        mock_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id="507f1f77bcf86cd799439011"))
        mock_collection.find_one = AsyncMock(return_value={"_id": "patient123"})  # Mock patient exists

        # Mock multiple images for retrieval with required fields
        image_docs = [
            {
                "_id": ObjectId("507f1f77bcf86cd799439011"),
                "patient_id": ObjectId("507f1f77bcf86cd799439011"),
                "filename": "multi1.jpg",
                "file_path": "/uploads/multi1.jpg",
                "uploaded_at": "2025-01-01T00:00:00Z",
                "image_type": "original",
                "file_size": 1024,
                "mime_type": "image/jpeg",
                "width": 100,
                "height": 100
            },
            {
                "_id": ObjectId("507f1f77bcf86cd799439012"),
                "patient_id": ObjectId("507f1f77bcf86cd799439011"),
                "filename": "multi2.jpg",
                "file_path": "/uploads/multi2.jpg",
                "uploaded_at": "2025-01-01T00:00:00Z",
                "image_type": "original",
                "file_size": 1024,
                "mime_type": "image/jpeg",
                "width": 100,
                "height": 100
            }
        ]

        async def mock_find():
            for doc in image_docs:
                yield doc

        mock_collection.find.return_value = mock_find()
        mock_get_database.return_value = mock_db

        patient_id = "507f1f77bcf86cd799439011"

        # Upload first image
        image1_path = self.create_test_image()
        try:
            with open(image1_path, 'rb') as f:
                response1 = client.post(
                    f"/images/upload/{patient_id}",
                    files={"file": ("multi1.jpg", f, "image/jpeg")}
                )
            assert response1.status_code == 200

            # Upload second image
            image2_path = self.create_test_image()
            with open(image2_path, 'rb') as f:
                response2 = client.post(
                    f"/images/upload/{patient_id}",
                    files={"file": ("multi2.jpg", f, "image/jpeg")}
                )
            assert response2.status_code == 200

            # Check both images are returned
            response = client.get(f"/images/{patient_id}")
            assert response.status_code == 200
            images = response.json()
            assert len(images) >= 2

            # Verify filenames
            filenames = [img["filename"] for img in images]
            assert "multi1.jpg" in filenames
            assert "multi2.jpg" in filenames

        finally:
            os.unlink(image1_path)
            if 'image2_path' in locals():
                os.unlink(image2_path)