from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.database import Database
from typing import List, Dict, Any
from app.models import Patient
from datetime import datetime
from pydantic import ValidationError

router = APIRouter()

@router.get("/patients")
async def get_all_patients():
    try:
        try:
            db = Database.get_database()
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Database not available")

        patients = []
        async for patient_doc in db.patients.find():
            patient = dict(patient_doc)
            patient["id"] = str(patient["_id"])
            del patient["_id"]
            patients.append(patient)
        return patients
    except HTTPException:
        raise
    except Exception as e:
        return []

@router.get("/patients/search")
async def search_patients(q: str = ""):
    try:
        db = Database.get_database()
        patients = []
        query = {}
        if q:
            query = {
                "$or": [
                    {"name": {"$regex": q, "$options": "i"}},
                    {"nic": {"$regex": q, "$options": "i"}}
                ]
            }

        async for patient_doc in db.patients.find(query).limit(10):
            patient = dict(patient_doc)
            patient["id"] = patient["_id"]
            del patient["_id"]
            patients.append(patient)
        return patients
    except Exception as e:
        return []

@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    try:
        if not patient_id or patient_id == "undefined":
            raise HTTPException(status_code=400, detail="Invalid patient ID")

        if not ObjectId.is_valid(patient_id):
            raise HTTPException(status_code=400, detail="Invalid patient ID format")

        try:
            db = Database.get_database()
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Database not available")

        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        patient["id"] = str(patient["_id"])
        del patient["_id"]
        return patient
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/patients")
async def create_patient(patient: Patient):
    try:
        try:
            db = Database.get_database()
        except ConnectionError:
            raise HTTPException(status_code=503, detail="Database not available")

        # Convert to dict and add MongoDB fields
        patient_data = patient.dict(by_alias=True, exclude_unset=True)
        patient_data["_id"] = ObjectId()
        patient_data["created_at"] = datetime.utcnow()
        patient_data["updated_at"] = datetime.utcnow()

        # Insert into database
        result = await db.patients.insert_one(patient_data)
        patient_id = str(result.inserted_id)

        return {"id": patient_id, "message": "Patient created successfully"}

    except ConnectionError:
        raise HTTPException(status_code=503, detail="Database not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create patient: {str(e)}")

@router.post("/patients/raw")
async def create_patient_raw(patient_data: Dict[str, Any]):
    """Alternative endpoint for raw JSON data (for debugging/testing)"""
    try:
        # Add timestamps
        patient_data["_id"] = ObjectId()
        patient_data["created_at"] = datetime.utcnow()
        patient_data["updated_at"] = datetime.utcnow()

        db = Database.get_database()
        result = await db['patients'].insert_one(patient_data)
        patient_data["id"] = str(result.inserted_id)
        del patient_data["_id"]
        return patient_data
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create patient")
