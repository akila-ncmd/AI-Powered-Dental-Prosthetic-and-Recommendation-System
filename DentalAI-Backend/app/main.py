# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
from app.database import Database
from app.models import Patient, DetectedCondition, Recommendation, Image, DetectedConditionType
from app.recommendation_engine import recommendation_engine
from bson import ObjectId
from typing import List
from pydantic import ValidationError
import os
import shutil
import cv2
import logging
from datetime import datetime
from app.routes import patients

# --------------------------
# Paths
# --------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")
MODEL_PATH = os.path.join(BASE_DIR, "model", "best.pt")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# --------------------------
# Load YOLO model
# --------------------------
model = YOLO(MODEL_PATH)

# --------------------------
# Lifespan event handler (FastAPI best practice)
# --------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events"""
    # Startup
    logger = logging.getLogger(__name__)
    logger.info("🚀 Starting Dental X-ray AI API...")

    try:
        await Database.connect_to_mongo()

        if Database.is_connected():
            logger.info("✅ Database connection established")

            # Initialize treatment knowledge base only if database is connected
            await recommendation_engine.initialize_treatment_knowledge_base_in_db()
            logger.info("✅ Treatment knowledge base initialized")
        else:
            logger.warning("⚠️  Database not available - continuing with limited functionality")

    except Exception as e:
        logger.error(f"❌ Failed to initialize database on startup: {e}")
        logger.warning("⚠️  Continuing with limited functionality (no database)")
        # Don't raise - allow the app to start without database

    yield

    # Shutdown
    logger.info("🔄 Shutting down Dental X-ray AI API...")
    await Database.close_mongo_connection()
    logger.info("✅ Database connection closed")

# --------------------------
# Custom JSON encoder for ObjectId
# --------------------------
def objectid_encoder(obj):
    """Custom encoder for ObjectId"""
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

# --------------------------
# FastAPI app setup
# --------------------------
app = FastAPI(
    title="Dental X-ray AI API",
    description="AI-powered dental prosthetic recommendation system",
    version="1.0.0",
    lifespan=lifespan,
    json_encoders={ObjectId: objectid_encoder}
)

app.include_router(patients.router, prefix="", tags=["Patients"])

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_FOLDER), name="uploads")
app.mount("/outputs", StaticFiles(directory=OUTPUT_FOLDER), name="outputs")

# --------------------------
# Dependency
# --------------------------
async def get_database():
    """Get database dependency with graceful fallback"""
    try:
        return Database.get_database()
    except ConnectionError:
        # Return None if database is not available
        return None

# --------------------------
# Health check
# --------------------------
@app.get("/")
def root():
    return {"message": "Dental X-ray AI API is running!"}

@app.get("/db-test")
async def db_test():
    """Test database connectivity and return collections"""
    try:
        if not Database.is_connected():
            return {
                "status": "disconnected",
                "message": "Database not connected",
                "collections": []
            }

        health = await Database.health_check()
        return {
            "status": "connected",
            "message": "Database connection successful",
            "database_name": health.get("database", "unknown"),
            "collections": health.get("collections", []),
            "stats": health.get("stats", {})
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database test failed: {str(e)}",
            "collections": []
        }

# --------------------------
# Patient CRUD
# --------------------------
# ALL patient routes are handled by the patients router in routes/patients.py
# No patient CRUD logic should exist in main.py to avoid conflicts

# --------------------------
# Image Upload
# --------------------------
@app.post("/images/upload/{patient_id}", response_model=Image)
async def upload_image(patient_id: str, file: UploadFile = File(...), db=Depends(get_database)):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if not patient_id or patient_id == "undefined":
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    img = cv2.imread(file_path)
    height, width = img.shape[:2] if img is not None else (None, None)

    image = Image(
        patient_id=ObjectId(patient_id),
        image_type="original",
        filename=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        mime_type=file.content_type or "image/jpeg",
        width=width,
        height=height
    )

    image_dict = image.dict(by_alias=True, exclude_unset=True)
    image_dict["_id"] = ObjectId()
    result = await db.images.insert_one(image_dict)
    image.id = result.inserted_id

    return image

@app.get("/images/{patient_id}", response_model=List[Image])
async def get_patient_images(patient_id: str, db=Depends(get_database)):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if not patient_id or patient_id == "undefined":
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID")
    images_list = []
    async for img in db.images.find({"patient_id": ObjectId(patient_id)}):
        images_list.append(Image(**img))
    return images_list

# --------------------------
# Prediction Route
# --------------------------
@app.post("/predict")
async def predict(request: Request, file: UploadFile = File(...)):
    try:
        input_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = model.predict(
            source=input_path,
            save=True,
            project=OUTPUT_FOLDER,
            name="predictions",
            exist_ok=True
        )

        detected_classes = set()

        for r in results:
            if hasattr(r, 'names') and r.boxes is not None:
                for idx, cls_id in enumerate(r.boxes.cls):
                    cls_name = r.names[int(cls_id)]
                    detected_classes.add(cls_name)

        annotated_image_path = os.path.join(OUTPUT_FOLDER, "predictions", file.filename)
        annotated_url = ""
        if os.path.exists(annotated_image_path):
            annotated_url = f"{str(request.base_url)[:-1]}/outputs/predictions/{file.filename}"

        return JSONResponse({
            "message": "Prediction successful",
            "detected_conditions": list(detected_classes),
            "output_image": annotated_url
        })

    except FileNotFoundError as e:
        logging.error(f"File not found error in prediction: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file or file not found")
    except ValueError as e:
        logging.error(f"Value error in prediction: {e}")
        raise HTTPException(status_code=400, detail="Invalid image format or corrupted file")
    except Exception as e:
        logging.error(f"Unexpected error in prediction: {e}")
        raise HTTPException(status_code=500, detail="AI model prediction failed")

# ------------------
# Additional API endpoints for frontend
# ------------------

@app.get("/patients/{patient_id}/conditions")
async def get_patient_conditions(patient_id: str, db=Depends(get_database)):
    """Get all detected conditions for a patient"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if not patient_id or patient_id == "undefined":
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    conditions_list = []
    async for condition in db.detected_conditions.find({"patient_id": ObjectId(patient_id)}):
        conditions_list.append({
            "id": str(condition["_id"]),
            "condition_type": condition["condition_type"],
            "confidence_score": condition.get("confidence_score"),
            "bounding_box": condition.get("bounding_box"),
            "detected_at": condition.get("detected_at")
        })
    return conditions_list

@app.get("/patients/{patient_id}/latest-image")
async def get_patient_latest_image(patient_id: str, db=Depends(get_database)):
    """Get the latest annotated image for a patient"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if not patient_id or patient_id == "undefined":
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    # Get the latest annotated image
    latest_image = await db.images.find_one(
        {"patient_id": ObjectId(patient_id), "image_type": "annotated"},
        sort=[("uploaded_at", -1)]
    )

    if not latest_image:
        return {"image_url": None, "detected_conditions": []}

    image_url = f"http://127.0.0.1:8000/outputs/predictions/{latest_image['filename']}"
    detected_conditions = latest_image.get("annotations", {}).get("detected_conditions", [])

    return {
        "image_url": image_url,
        "detected_conditions": detected_conditions
    }

# ------------------
# Recommendations API endpoints
# ------------------

@app.post("/recommendations/")
async def create_recommendation(recommendation: dict, db=Depends(get_database)):
    """Create a new recommendation"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        recommendation_dict = recommendation.copy()
        recommendation_dict["_id"] = ObjectId()
        recommendation_dict["created_at"] = datetime.utcnow()

        result = await db.recommendations.insert_one(recommendation_dict)
        return {"id": str(result.inserted_id), "message": "Recommendation created successfully"}
    except Exception as e:
        print(f"Error creating recommendation: {e}")
        raise HTTPException(status_code=500, detail="Failed to create recommendation")

@app.get("/recommendations/{patient_id}")
async def get_patient_recommendations(patient_id: str, db=Depends(get_database)):
    """Get all recommendations for a patient"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if not patient_id or patient_id == "undefined":
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    recommendations_list = []
    async for rec in db.recommendations.find({"patient_id": patient_id}):
        rec["id"] = str(rec["_id"])
        del rec["_id"]
        recommendations_list.append(rec)
    return recommendations_list

# ------------------
# AI Recommendations API endpoint
# ------------------

@app.post("/ai-recommendations/{patient_id}")
async def generate_ai_recommendations(
    patient_id: str,
    request_data: dict,
    db=Depends(get_database)
):
    """Generate AI-powered treatment recommendations"""
    try:
        if not patient_id or patient_id == "undefined":
            raise HTTPException(status_code=400, detail="Invalid patient ID")

        if not ObjectId.is_valid(patient_id):
            raise HTTPException(status_code=400, detail="Invalid patient ID")

        # Extract detected conditions from request
        detected_conditions = request_data.get("detected_conditions", [])

        # If database is available, try to verify patient and get stored conditions
        if db is not None:
            # Verify patient exists
            patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
            if not patient:
                raise HTTPException(status_code=404, detail="Patient not found")

            if not detected_conditions:
                # If no conditions provided, try to get from database or use default
                conditions_cursor = db.detected_conditions.find({"patient_id": ObjectId(patient_id)})
                stored_conditions = []
                async for condition in conditions_cursor:
                    stored_conditions.append(condition["condition_type"])

                detected_conditions = stored_conditions if stored_conditions else ["Caries"]
        else:
            # Database not available, use provided conditions or default
            if not detected_conditions:
                detected_conditions = ["Caries"]

        logging.info(f"Generating recommendations for patient {patient_id} with conditions: {detected_conditions}")

        # Generate recommendations using the AI engine
        recommendations = await recommendation_engine.generate_recommendations(
            patient_id, detected_conditions
        )

        # Format response to match frontend expectations
        formatted_recommendations = []
        for rec in recommendations:
            formatted_rec = {
                "treatment": rec["treatment"],
                "cost_estimate": rec["cost_estimate"],
                "duration": rec["duration"],
                "suitability_score": rec["suitability_score"],
                "rationale": rec["rationale"],
                "success_rate": rec.get("success_rate", 90),
                "risk_level": rec.get("risk_level", "medium"),
                "recovery_time": rec.get("recovery_time", "1-2 weeks"),
                "pros": rec.get("pros", []),
                "cons": rec.get("cons", []),
                "ml_confidence": rec.get("ml_confidence", 0.8)
            }
            formatted_recommendations.append(formatted_rec)

        return {
            "patient_id": patient_id,
            "detected_conditions": detected_conditions,
            "recommendations": formatted_recommendations,
            "generated_at": datetime.utcnow().isoformat(),
            "engine_version": "1.0"
        }

    except ValueError as ve:
        logging.error(f"Validation error in AI recommendations: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"Error generating AI recommendations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")

@app.get("/ai-recommendations/{patient_id}")
async def get_ai_recommendations(patient_id: str, db=Depends(get_database)):
    """Get stored AI recommendations for a patient"""
    try:
        if not patient_id or patient_id == "undefined":
            raise HTTPException(status_code=400, detail="Invalid patient ID")

        if not ObjectId.is_valid(patient_id):
            raise HTTPException(status_code=400, detail="Invalid patient ID")

        # If database is not available, return empty list
        if db is None:
            return {
                "patient_id": patient_id,
                "recommendations": [],
                "count": 0,
                "message": "Database not available"
            }

        # Get recommendations from database
        recommendations_list = []
        async for rec in db.recommendations.find({"patient_id": patient_id}).sort("suitability_score", -1):
            formatted_rec = {
                "id": str(rec["_id"]),
                "treatment": rec.get("treatment_type", rec.get("treatment", "Unknown")),
                "cost_estimate": rec.get("cost_estimate", "Cost not available"),
                "duration": rec.get("duration", "Duration not specified"),
                "suitability_score": rec.get("suitability_score", 0),
                "rationale": rec.get("rationale", "No rationale provided"),
                "success_rate": rec.get("success_rate", 90),
                "risk_level": rec.get("risk_level", "medium"),
                "recovery_time": rec.get("recovery_time", "1-2 weeks"),
                "pros": rec.get("pros", []),
                "cons": rec.get("cons", []),
                "created_at": rec.get("created_at", datetime.utcnow()).isoformat()
            }
            recommendations_list.append(formatted_rec)

        return {
            "patient_id": patient_id,
            "recommendations": recommendations_list,
            "count": len(recommendations_list)
        }

    except Exception as e:
        logging.error(f"Error fetching AI recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")
