import pytest
from app.models import Patient, Image, Recommendation, DetectedCondition
from pydantic import ValidationError
from bson import ObjectId

class TestPatientModel:
    """Test cases for Patient data model"""

    def test_valid_patient_creation(self):
        """Test creating a patient with valid data"""
        patient_data = {
            "name": "John Doe",
            "nic": "123456789V",
            "age": 35,
            "gender": "Male",
            "budget": 50000,
            "medical_conditions": ["Diabetes"],
            "habits": ["Smoking"],
            "past_dental_treatments": ["Fillings"]
        }

        patient = Patient(**patient_data)
        assert patient.name == "John Doe"
        assert patient.age == 35
        assert patient.budget == 50000
        assert patient.gender == "Male"

    def test_invalid_age_validation(self):
        """Test age validation constraints"""
        with pytest.raises(ValidationError):
            Patient(
                name="Test Patient",
                nic="123456789V",
                age=150,  # Invalid age
                gender="Male",
                budget=50000
            )

    def test_invalid_budget_validation(self):
        """Test budget validation constraints"""
        with pytest.raises(ValidationError):
            Patient(
                name="Test Patient",
                nic="123456789V",
                age=35,
                gender="Male",
                budget=5000  # Below minimum
            )

    def test_invalid_gender_validation(self):
        """Test gender validation constraints"""
        with pytest.raises(ValidationError):
            Patient(
                name="Test Patient",
                nic="123456789V",
                age=35,
                gender="Invalid",  # Invalid gender
                budget=50000
            )

class TestImageModel:
    """Test cases for Image data model"""

    def test_valid_image_creation(self):
        """Test creating an image with valid data"""
        valid_object_id = ObjectId()
        image_data = {
            "patient_id": str(valid_object_id),
            "image_type": "original",
            "filename": "xray001.jpg",
            "file_path": "/uploads/xray001.jpg",
            "file_size": 2048576,
            "mime_type": "image/jpeg",
            "width": 1024,
            "height": 768
        }

        image = Image(**image_data)
        assert image.filename == "xray001.jpg"
        assert image.file_size == 2048576
        assert image.mime_type == "image/jpeg"
        assert image.image_type == "original"

class TestRecommendationModel:
    """Test cases for Recommendation data model"""

    def test_valid_recommendation_creation(self):
        """Test creating a recommendation with valid data"""
        valid_object_id = ObjectId()
        rec_data = {
            "patient_id": str(valid_object_id),
            "treatment_type": "Dental Implant",
            "cost_range_min": 150000,
            "cost_range_max": 200000,
            "duration": "3-6 months",
            "suitability_score": 85,
            "description": "Permanent solution for missing teeth"
        }

        recommendation = Recommendation(**rec_data)
        assert recommendation.treatment_type == "Dental Implant"
        assert recommendation.suitability_score == 85
        assert recommendation.cost_range_min == 150000
        assert recommendation.cost_range_max == 200000

    def test_invalid_cost_range_validation(self):
        """Test cost range validation"""
        valid_object_id = ObjectId()
        with pytest.raises(ValidationError):
            Recommendation(
                patient_id=str(valid_object_id),
                treatment_type="Dental Implant",
                cost_range_min=200000,
                cost_range_max=150000,  # Max < Min
                duration="3-6 months",
                suitability_score=85,
                description="Test"
            )

class TestDetectedConditionModel:
    """Test cases for DetectedCondition data model"""

    def test_valid_condition_creation(self):
        """Test creating a detected condition with valid data"""
        valid_object_id = ObjectId()
        condition_data = {
            "patient_id": str(valid_object_id),
            "condition_type": "Caries",
            "confidence_score": 0.87,
            "bounding_box": {"x1": 150, "y1": 200, "x2": 180, "y2": 230}
        }

        condition = DetectedCondition(**condition_data)
        assert condition.condition_type == "Caries"
        assert condition.confidence_score == 0.87
        assert isinstance(condition.bounding_box, dict)