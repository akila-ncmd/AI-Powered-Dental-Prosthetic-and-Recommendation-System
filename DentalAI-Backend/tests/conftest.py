import os

import pytest
from unittest.mock import MagicMock


@pytest.fixture(autouse=True)
def sweep_generated_radiographs():
    """Delete the images a test makes the API write to disk.

    POST /predict and POST /images/upload each write a real file under
    DentalAI-Backend/app, so a suite that never sweeps up grows those folders
    by a handful of radiographs on every run - they had accumulated into the
    hundreds. Only files that appear while the test runs are removed, so the
    checked-in dataset is untouched.
    """
    # Imported here rather than at module scope: conftest is loaded before
    # any test module, and this keeps collection working even for tests that
    # never touch the app.
    from app.main import PREDICTION_FOLDER, UPLOAD_FOLDER

    folders = [folder for folder in (UPLOAD_FOLDER, PREDICTION_FOLDER) if os.path.isdir(folder)]
    before = {folder: set(os.listdir(folder)) for folder in folders}
    try:
        yield
    finally:
        for folder, existing in before.items():
            for name in set(os.listdir(folder)) - existing:
                try:
                    os.unlink(os.path.join(folder, name))
                except OSError:
                    # A file still held open on Windows is not worth failing
                    # a passing test over.
                    pass


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