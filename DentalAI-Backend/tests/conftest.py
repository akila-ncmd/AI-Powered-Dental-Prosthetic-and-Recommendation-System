import pytest
from unittest.mock import MagicMock

@pytest.fixture
def mock_db():
    """Mock database for testing"""
    return MagicMock()

@pytest.fixture
def sample_patient_data():
    """Sample patient data for testing"""
    return {
        "name": "John Doe",
        "nic": "123456789V",
        "age": 35,
        "gender": "Male",
        "budget": 50000,
        "medical_conditions": ["Diabetes"],
        "habits": ["Smoking"],
        "other_medical_condition": "",
        "allergies": "Penicillin",
        "family_dental_history": "Mother had gum disease"
    }

@pytest.fixture
def sample_recommendation_data():
    """Sample recommendation data for testing"""
    return {
        "patient_id": "test_patient_id",
        "treatment_type": "Dental Implant",
        "condition": "Missing Teeth",
        "cost_estimate": "LKR 150,000 - LKR 200,000",
        "cost_min": 150000,
        "cost_max": 200000,
        "duration": "3-6 months",
        "suitability_score": 85,
        "success_rate": 95,
        "risk_level": "medium",
        "recovery_time": "2-4 weeks",
        "rationale": "Permanent solution suitable for patient's age and budget",
        "pros": ["Permanent solution", "Natural appearance"],
        "cons": ["Higher cost", "Surgical procedure"],
        "ml_confidence": 0.8
    }