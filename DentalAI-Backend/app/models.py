from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum


class PyObjectId(ObjectId):
    """Custom ObjectId for Pydantic models"""
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}


class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"


class MedicalCondition(str, Enum):
    DIABETES = "Diabetes"
    HYPERTENSION = "Hypertension"
    HEART_DISEASE = "Heart Disease"
    ALLERGIES = "Allergies"
    PAST_DENTAL_TREATMENTS = "Past Dental Treatments"
    BONE_LOSS = "Bone Loss"
    CARIES = "Caries"
    CROWN = "Crown"
    FILLING = "Filling"
    IMPLANT = "Implant"
    MISSING_TEETH = "Missing Teeth"
    ROOT_CANAL_TREATMENT = "Root Canal Treatment"
    IMPACTED_TOOTH = "Impacted Tooth"
    OTHER = "Other"


class Habit(str, Enum):
    SMOKING = "Smoking"
    ALCOHOL = "Alcohol"
    BRUXISM = "Bruxism"
    # The patient-data form offers these three as well; without them here the
    # form's own options would fail validation.
    BETEL_CHEWING = "Betel Chewing"
    COFFEE = "Coffee"
    TEA = "Tea"


class PastDentalTreatment(str, Enum):
    FILLINGS = "Fillings"
    CROWNS = "Crowns"
    IMPLANTS = "Implants"
    ROOT_CANAL = "Root Canal"
    EXTRACTIONS = "Extractions"


class DetectedConditionType(str, Enum):
    BONE_LOSS = "Bone Loss"
    CARIES = "Caries"
    CROWN = "Crown"
    FILLING = "Filling"
    IMPLANT = "Implant"
    MISSING_TEETH = "Missing Teeth"
    PERIAPICAL_LESION = "Periapical Lesion"
    ROOT_CANAL_TREATMENT = "Root Canal Treatment"
    ROOT_PIECE = "Root Piece"
    IMPACTED_TOOTH = "Impacted Tooth"


class TreatmentType(str, Enum):
    BONE_GRAFT = "Bone Graft"
    DENTAL_IMPLANT = "Dental Implant"
    FILLING = "Dental Filling"
    CROWN = "Crown"
    CROWN_REPLACEMENT = "Crown Replacement"
    PARTIAL_DENTURE = "Partial Denture"
    FIXED_BRIDGE = "Fixed Bridge"
    ROOT_CANAL_TREATMENT = "Root Canal Treatment"
    EXTRACTION = "Extraction"
    SURGICAL_EXTRACTION = "Surgical Extraction"


class ImageType(str, Enum):
    ORIGINAL = "original"
    ANNOTATED = "annotated"


# Patient Model
class Patient(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., min_length=1, max_length=100, description="Patient's full name")
    nic: str = Field(..., min_length=1, max_length=20, description="National ID number")
    age: int = Field(..., ge=1, le=120, description="Patient's age in years")
    gender: Gender = Field(..., description="Patient's gender")
    budget: int = Field(..., ge=10000, description="Patient's budget in LKR")
    medical_conditions: List[MedicalCondition] = Field(default_factory=list, description="List of medical conditions")
    other_medical_condition: Optional[str] = Field(None, max_length=200, description="Other medical condition if specified")
    allergies: Optional[str] = Field(None, max_length=500, description="Patient allergies")
    habits: List[Habit] = Field(default_factory=list, description="Patient habits")
    past_dental_treatments: List[PastDentalTreatment] = Field(default_factory=list, description="Past dental treatments")
    family_dental_history: Optional[str] = Field(None, max_length=500, description="Family dental history")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        validate_assignment = True
        schema_extra = {
            "example": {
                "name": "John Doe",
                "nic": "123456789V",
                "age": 45,
                "gender": "Male",
                "budget": 150000,
                "medical_conditions": ["Diabetes", "Hypertension"],
                "allergies": "Penicillin",
                "habits": ["Smoking"],
                "past_dental_treatments": ["Fillings", "Crowns"]
            }
        }


class PatientCreate(BaseModel):
    """Request body for POST /patients.

    Mirrors Patient minus the server-owned fields (_id, created_at,
    updated_at), so a malformed submission is rejected with a 422 instead of
    being written to MongoDB unvalidated.
    """
    name: str = Field(..., min_length=1, max_length=100, description="Patient's full name")
    nic: str = Field(..., min_length=1, max_length=20, description="National ID number")
    age: int = Field(..., ge=1, le=120, description="Patient's age in years")
    gender: Gender = Field(..., description="Patient's gender")
    budget: int = Field(..., ge=10000, description="Patient's budget in LKR")
    medical_conditions: List[MedicalCondition] = Field(default_factory=list, description="List of medical conditions")
    other_medical_condition: Optional[str] = Field(None, max_length=200, description="Other medical condition if specified")
    allergies: Optional[str] = Field(None, max_length=500, description="Patient allergies")
    habits: List[Habit] = Field(default_factory=list, description="Patient habits")
    past_dental_treatments: List[PastDentalTreatment] = Field(default_factory=list, description="Past dental treatments")
    family_dental_history: Optional[str] = Field(None, max_length=500, description="Family dental history")


# Analysis Model
class Analysis(BaseModel):
    """One completed run of the model against one radiograph.

    Every run is kept, so a patient accumulates a history rather than having
    the previous findings overwritten. Reads that want "the patient's current
    findings" resolve the most recent Analysis and filter on its id; without
    this document a run that detected nothing would be indistinguishable from
    no run at all, and the previous run's findings would surface as current.
    """
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    patient_id: PyObjectId = Field(..., description="Reference to the patient")
    analysis_key: str = Field(..., max_length=255, description="Identifies the /predict run this came from")
    source_filename: Optional[str] = Field(None, max_length=255, description="Original radiograph on disk")
    annotated_filename: Optional[str] = Field(None, max_length=255, description="Annotated output on disk")
    detected_conditions: List[DetectedConditionType] = Field(default_factory=list, description="Distinct findings")
    condition_count: int = Field(0, ge=0, description="Number of detection boxes stored")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "patient_id": "507f1f77bcf86cd799439011",
                "analysis_key": "xray_9f3c1b2a4d5e.jpg",
                "source_filename": "xray_9f3c1b2a4d5e.jpg",
                "annotated_filename": "xray_9f3c1b2a4d5e.jpg",
                "detected_conditions": ["Missing Teeth", "Caries"],
                "condition_count": 4
            }
        }


# Detected Condition Model
class DetectedCondition(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    patient_id: PyObjectId = Field(..., description="Reference to the patient")
    analysis_id: Optional[PyObjectId] = Field(None, description="The Analysis run this detection belongs to")
    condition_type: DetectedConditionType = Field(..., description="Type of detected condition")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI confidence score")
    bounding_box: Optional[Dict[str, Any]] = Field(None, description="Bounding box coordinates from AI detection")
    description: Optional[str] = Field(None, max_length=500, description="Additional description")
    detected_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "patient_id": "507f1f77bcf86cd799439011",
                "condition_type": "Caries",
                "confidence_score": 0.95,
                "bounding_box": {"x1": 100, "y1": 200, "x2": 150, "y2": 250},
                "description": "Cavity detected in upper molar"
            }
        }


# Recommendation Model
class Recommendation(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    patient_id: PyObjectId = Field(..., description="Reference to the patient")
    condition_id: Optional[PyObjectId] = Field(None, description="Reference to the detected condition")
    treatment_type: TreatmentType = Field(..., description="Type of recommended treatment")
    cost_range_min: int = Field(..., ge=0, description="Minimum cost in LKR")
    cost_range_max: int = Field(..., ge=0, description="Maximum cost in LKR")
    duration: str = Field(..., max_length=50, description="Treatment duration")
    suitability_score: int = Field(..., ge=0, le=100, description="Suitability percentage")
    description: str = Field(..., max_length=500, description="Treatment description")
    pros: List[str] = Field(default_factory=list, description="Treatment advantages")
    cons: List[str] = Field(default_factory=list, description="Treatment disadvantages")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('cost_range_max')
    def validate_cost_range(cls, v, values):
        if 'cost_range_min' in values and v < values['cost_range_min']:
            raise ValueError('cost_range_max must be greater than or equal to cost_range_min')
        return v

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "patient_id": "507f1f77bcf86cd799439011",
                "condition_id": "507f1f77bcf86cd799439012",
                "treatment_type": "Dental Filling",
                "cost_range_min": 3000,
                "cost_range_max": 8000,
                "duration": "1-2 hours",
                "suitability_score": 85,
                "description": "Recommended for patients with caries",
                "pros": ["Improves oral health", "Clinically effective"],
                "cons": ["May require multiple visits", "Cost varies depending on complexity"]
            }
        }


# Image Model
class Image(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    patient_id: PyObjectId = Field(..., description="Reference to the patient")
    analysis_id: Optional[PyObjectId] = Field(None, description="The Analysis run this image belongs to")
    image_type: ImageType = Field(..., description="Type of image (original or annotated)")
    filename: str = Field(..., max_length=255, description="Image filename")
    file_path: str = Field(..., max_length=500, description="File path on server")
    file_size: Optional[int] = Field(None, ge=0, description="File size in bytes")
    mime_type: str = Field(..., max_length=50, description="MIME type of the image")
    width: Optional[int] = Field(None, ge=0, description="Image width in pixels")
    height: Optional[int] = Field(None, ge=0, description="Image height in pixels")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    annotations: Optional[Dict[str, Any]] = Field(None, description="AI annotations data")

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "patient_id": "507f1f77bcf86cd799439011",
                "image_type": "original",
                "filename": "xray_001.jpg",
                "file_path": "/uploads/xray_001.jpg",
                "file_size": 2048576,
                "mime_type": "image/jpeg",
                "width": 1024,
                "height": 768,
                "annotations": {"detected_conditions": ["Caries"], "bounding_boxes": [...]}
            }
        }


# MongoDB Indexes (for reference in database setup)
MONGODB_INDEXES = {
    "patients": [
        {"keys": [("nic", 1)], "unique": True, "name": "unique_nic"},
        {"keys": [("created_at", -1)], "name": "created_at_desc"},
    ],
    "analyses": [
        # The reads resolve "the latest analysis" with this compound sort.
        {"keys": [("patient_id", 1), ("created_at", -1)], "name": "patient_id_created_at_desc"},
        {"keys": [("patient_id", 1), ("analysis_key", 1)], "unique": True, "name": "unique_patient_analysis_key"},
    ],
    "detected_conditions": [
        {"keys": [("patient_id", 1)], "name": "patient_id_index"},
        {"keys": [("analysis_id", 1)], "name": "analysis_id_index"},
        {"keys": [("detected_at", -1)], "name": "detected_at_desc"},
        {"keys": [("condition_type", 1)], "name": "condition_type_index"},
    ],
    "recommendations": [
        {"keys": [("patient_id", 1)], "name": "patient_id_index"},
        {"keys": [("condition_id", 1)], "name": "condition_id_index"},
        {"keys": [("suitability_score", -1)], "name": "suitability_score_desc"},
        {"keys": [("created_at", -1)], "name": "created_at_desc"},
    ],
    "images": [
        {"keys": [("patient_id", 1)], "name": "patient_id_index"},
        {"keys": [("analysis_id", 1)], "name": "analysis_id_index"},
        {"keys": [("image_type", 1)], "name": "image_type_index"},
        {"keys": [("uploaded_at", -1)], "name": "uploaded_at_desc"},
    ],
}