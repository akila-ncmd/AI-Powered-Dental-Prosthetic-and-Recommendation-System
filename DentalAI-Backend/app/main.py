# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
from app.database import Database
from app.models import Patient, Analysis, DetectedCondition, Recommendation, Image, DetectedConditionType
from app.recommendation_engine import recommendation_engine
from bson import ObjectId
from typing import Any, Dict, List, Optional
from pydantic import ValidationError
import mimetypes
import os
import re
import shutil
import uuid
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

PREDICTION_FOLDER = os.path.join(OUTPUT_FOLDER, "predictions")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(PREDICTION_FOLDER, exist_ok=True)

# Extensions cv2.imwrite can reliably encode; anything else is stored as .png
SAFE_IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}


def sanitize_upload_filename(filename: str) -> str:
    """Reduce a client-supplied filename to a safe basename.

    Strips any directory component so the result can never escape the target
    folder, then keeps only characters that are safe in a path and a URL.
    """
    # basename() alone is not enough on Linux for Windows-style separators
    base = os.path.basename(str(filename or "").replace("\\", "/").rsplit("/", 1)[-1])
    stem, ext = os.path.splitext(base)
    stem = re.sub(r"[^A-Za-z0-9._-]", "_", stem).strip("._") or "upload"
    ext = ext.lower() if ext.lower() in SAFE_IMAGE_SUFFIXES else ".png"
    return f"{stem[:80]}{ext}"


def resolve_stored_file(url_or_name: Optional[str], folder: str) -> Optional[str]:
    """Map a client-supplied URL back onto a file this server already wrote.

    The caller only ever echoes back a name /predict produced, so the exact
    filename is preserved rather than recomputed - the annotated name carries
    a run id that keeps two patients' uploads apart. Everything else about the
    value is treated as hostile: the query string is dropped, the path is
    reduced to a basename, and the resolved path must still sit inside
    ``folder`` before the file is accepted.
    """
    if not url_or_name:
        return None

    candidate = str(url_or_name).split("?", 1)[0].split("#", 1)[0]
    candidate = os.path.basename(candidate.replace("\\", "/").rstrip("/"))
    if not candidate or candidate in {".", ".."}:
        return None

    root = os.path.realpath(folder)
    full = os.path.realpath(os.path.join(root, candidate))
    try:
        if os.path.commonpath([root, full]) != root:
            return None
    except ValueError:
        # Different drives on Windows - definitively outside the folder.
        return None

    return candidate if os.path.isfile(full) else None


# Every label a DetectedCondition may carry. Anything outside this set is
# skipped rather than written, so one unrecognised class cannot fail the
# whole insert.
VALID_CONDITION_TYPES = {member.value for member in DetectedConditionType}


def normalise_condition_label(label: Any) -> Optional[str]:
    """Map a raw YOLO class label onto a DetectedConditionType value.

    The trained model emits "Missing teeth", "Periapical lesion" and
    "impacted tooth"; the enum is title-cased. Writing the raw label into a
    DetectedCondition fails Pydantic validation - this was a production bug -
    so every write goes through the knowledge base's own alias table first.
    """
    if not isinstance(label, str) or not label.strip():
        return None
    canonical = recommendation_engine.canonical_condition(label)
    return canonical if canonical in VALID_CONDITION_TYPES else None


def _sequence_to_list(value: Any) -> list:
    """Best-effort conversion of a torch tensor / ndarray / sequence to a list."""
    if value is None:
        return []
    try:
        return list(value)
    except TypeError:
        return []


def _as_confidence(value: Any) -> Optional[float]:
    """Coerce a confidence to the 0.0-1.0 range DetectedCondition validates."""
    if value is None:
        return None
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, min(1.0, confidence))


def _as_bounding_box(value: Any) -> Optional[Dict[str, float]]:
    """Normalise xyxy coordinates - tensor row, list or dict - to a plain dict."""
    if value is None:
        return None

    if isinstance(value, dict):
        try:
            return {key: float(value[key]) for key in ("x1", "y1", "x2", "y2")}
        except (KeyError, TypeError, ValueError):
            return None

    try:
        coords = [float(coord) for coord in _sequence_to_list(value)[:4]]
    except (TypeError, ValueError):
        return None
    if len(coords) != 4:
        return None
    return {"x1": coords[0], "y1": coords[1], "x2": coords[2], "y2": coords[3]}


def _dedupe(values) -> list:
    """Unique values, first-seen order preserved."""
    return list(dict.fromkeys(values))


async def get_latest_analysis(db, patient_oid) -> Optional[dict]:
    """The most recent analysis run attached to this patient, if any."""
    return await db.analyses.find_one(
        {"patient_id": patient_oid},
        # created_at first; _id breaks ties for two runs in the same instant.
        sort=[("created_at", -1), ("_id", -1)],
    )


def scoped_to_analysis(patient_oid, analysis: Optional[dict]) -> Dict[str, Any]:
    """Query restricting detections or images to one analysis run.

    Every run is retained, so an unscoped query would mix findings from a
    radiograph that has since been superseded into the patient's current
    results. Documents written before analyses were tracked carry no
    analysis_id, so a patient with no Analysis document falls back to
    everything on file for them rather than to nothing at all.
    """
    query: Dict[str, Any] = {"patient_id": patient_oid}
    if analysis is not None:
        query["analysis_id"] = analysis["_id"]
    return query

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
    logger.info(" Starting Dental X-ray AI API...")

    try:
        await Database.connect_to_mongo()

        if Database.is_connected():
            logger.info(" Database connection established")

            # Initialize treatment knowledge base only if database is connected
            await recommendation_engine.initialize_treatment_knowledge_base_in_db()
            logger.info(" Treatment knowledge base initialized")
        else:
            logger.warning("  Database not available - continuing with limited functionality")

    except Exception as e:
        logger.error(f" Failed to initialize database on startup: {e}")
        logger.warning("  Continuing with limited functionality (no database)")
        # Don't raise - allow the app to start without database

    yield

    # Shutdown
    logger.info(" Shutting down Dental X-ray AI API...")
    await Database.close_mongo_connection()
    logger.info(" Database connection closed")

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

# Origins are read from ALLOWED_ORIGINS (comma-separated) so deployments can
# widen this without shipping a wildcard. A wildcard is invalid alongside
# allow_credentials=True and would expose patient data to any site.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:3001,"
        "http://127.0.0.1:3000,http://127.0.0.1:3001,"
        "http://localhost:7860,http://127.0.0.1:7860",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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

    # Never trust the client-supplied name as a path, and keep it unique so one
    # patient's upload cannot overwrite another's radiograph.
    safe_filename = sanitize_upload_filename(file.filename)
    stem, ext = os.path.splitext(safe_filename)
    stored_filename = f"{stem}_{uuid.uuid4().hex[:12]}{ext}"

    file_path = os.path.join(UPLOAD_FOLDER, stored_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    img = cv2.imread(file_path)
    height, width = img.shape[:2] if img is not None else (None, None)

    image = Image(
        patient_id=ObjectId(patient_id),
        image_type="original",
        filename=stored_filename,
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
        # Strip any directory component from the client-supplied name, then give
        # this run its own unique output name so a failed write can never fall
        # back to a previous patient's annotated image.
        safe_filename = sanitize_upload_filename(file.filename)
        run_id = uuid.uuid4().hex[:12]
        stem, ext = os.path.splitext(safe_filename)
        output_filename = f"{stem}_{run_id}{ext}"

        input_path = os.path.join(UPLOAD_FOLDER, f"{stem}_{run_id}{ext}")

        logging.info(f"Starting prediction for: {safe_filename} (run {run_id})")

        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        prediction_dir = PREDICTION_FOLDER
        os.makedirs(prediction_dir, exist_ok=True)

        results = model.predict(
            source=input_path,
            save=False, # We handle saving manually for better control
            project=OUTPUT_FOLDER,
            name="predictions",
            exist_ok=True,
            conf=0.25 # Ensure we catch relevant detections
        )

        detected_classes = set()
        detections = []
        annotated_image_path = os.path.join(prediction_dir, output_filename)
        annotated_saved = False

        if not results:
            logging.warning("No results returned from model")

        for r in results:
            # 1. Extract class names for response, and the per-box confidence
            # and coordinates a DetectedCondition needs. The class-name set is
            # built exactly as before so detected_conditions keeps its shape.
            if hasattr(r, 'names') and r.boxes is not None:
                class_ids = _sequence_to_list(getattr(r.boxes, "cls", None))
                confidences = _sequence_to_list(getattr(r.boxes, "conf", None))
                boxes_xyxy = _sequence_to_list(getattr(r.boxes, "xyxy", None))

                for idx, cls_id in enumerate(class_ids):
                    cls_name = r.names[int(cls_id)]
                    detected_classes.add(cls_name)
                    detections.append({
                        "label": cls_name,
                        # Canonical spelling so the attach step can store this
                        # without tripping over the model's label casing.
                        "condition_type": normalise_condition_label(cls_name) or cls_name,
                        "confidence": _as_confidence(confidences[idx]) if idx < len(confidences) else None,
                        "bounding_box": _as_bounding_box(boxes_xyxy[idx]) if idx < len(boxes_xyxy) else None,
                    })
            
            # 2. Plot the result. line_width/font_size are deliberately left
            # to Ultralytics' automatic scaling: the previous hardcoded
            # line_width=3, font_size=20 rendered labels so large on a 640px
            # radiograph that they covered the entire dentition and obscured
            # the anatomy the boxes were pointing at.
            res_plotted = r.plot(
                labels=True,
                boxes=True,
                probs=False
            )
            
            # Save the annotated image
            annotated_saved = bool(cv2.imwrite(annotated_image_path, res_plotted))
            if not annotated_saved:
                logging.error(f"CRITICAL: Failed to save annotated image to {annotated_image_path}")
            else:
                logging.info(f"Successfully saved annotated image to {annotated_image_path}")
            break

        # Only advertise a URL when THIS run actually wrote the file. Trusting
        # os.path.exists here would happily serve a previous run's annotation.
        if annotated_saved and os.path.exists(annotated_image_path):
            annotated_url = f"/api/outputs/predictions/{output_filename}"
            logging.info(f"Returning annotated image URL: {annotated_url}")
        else:
            logging.warning(f"No annotated image produced for run {run_id}")
            annotated_url = ""

        return JSONResponse({
            "message": "Prediction successful",
            "detected_conditions": list(detected_classes),
            "output_image": annotated_url,
            # Added so the analysis can be persisted once a patient exists.
            # The three keys above are unchanged for the current frontend.
            "detections": detections,
            "input_image": f"/api/uploads/{os.path.basename(input_path)}",
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

    patient_oid = ObjectId(patient_id)

    # Only the current radiograph's findings. Earlier runs are still on file
    # and are reachable through GET /patients/{id}/analyses.
    analysis = await get_latest_analysis(db, patient_oid)

    conditions_list = []
    async for condition in db.detected_conditions.find(scoped_to_analysis(patient_oid, analysis)):
        conditions_list.append({
            "id": str(condition["_id"]),
            "condition_type": condition["condition_type"],
            "confidence_score": condition.get("confidence_score"),
            "bounding_box": condition.get("bounding_box"),
            "detected_at": condition.get("detected_at"),
            "analysis_id": str(condition["analysis_id"]) if condition.get("analysis_id") else None,
        })
    return conditions_list


@app.get("/patients/{patient_id}/analyses")
async def get_patient_analyses(patient_id: str, db=Depends(get_database)):
    """Every analysis run on file for a patient, newest first.

    The scoped reads deliberately show only the current radiograph; this is
    where the retained history is readable.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if not patient_id or patient_id == "undefined":
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    analyses = []
    cursor = db.analyses.find({"patient_id": ObjectId(patient_id)}).sort([("created_at", -1), ("_id", -1)])
    async for analysis in cursor:
        analyses.append({
            "id": str(analysis["_id"]),
            "analysis_key": analysis.get("analysis_key"),
            "detected_conditions": analysis.get("detected_conditions", []),
            "condition_count": analysis.get("condition_count", 0),
            "annotated_image_url": (
                f"/api/outputs/predictions/{analysis['annotated_filename']}"
                if analysis.get("annotated_filename") else None
            ),
            "original_image_url": (
                f"/api/uploads/{analysis['source_filename']}"
                if analysis.get("source_filename") else None
            ),
            "created_at": analysis.get("created_at"),
        })

    return {
        "patient_id": patient_id,
        "analyses": analyses,
        "count": len(analyses),
        # The first entry is the one every other read is scoped to.
        "latest_analysis_id": analyses[0]["id"] if analyses else None,
    }

@app.get("/patients/{patient_id}/latest-image")
async def get_patient_latest_image(patient_id: str, db=Depends(get_database)):
    """Get the latest annotated image for a patient"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if not patient_id or patient_id == "undefined":
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    patient_oid = ObjectId(patient_id)

    # Get the latest annotated image, and the original it was produced from,
    # so the report can render the before/after pair straight from the
    # database instead of a blob: URL that dies on reload. Both are scoped to
    # the same analysis: taking the newest of each independently could pair
    # one run's original with another run's annotation.
    analysis = await get_latest_analysis(db, patient_oid)
    scope = scoped_to_analysis(patient_oid, analysis)

    latest_image = await db.images.find_one(
        {**scope, "image_type": "annotated"},
        sort=[("uploaded_at", -1)]
    )
    latest_original = await db.images.find_one(
        {**scope, "image_type": "original"},
        sort=[("uploaded_at", -1)]
    )

    # Relative URLs only: an absolute http://127.0.0.1:8000/... is unreachable
    # from any browser that is not on this machine.
    original_url = f"/api/uploads/{latest_original['filename']}" if latest_original else None

    if not latest_image:
        return {
            "image_url": None,
            "detected_conditions": [],
            "original_image_url": original_url,
        }

    image_url = f"/api/outputs/predictions/{latest_image['filename']}"
    detected_conditions = (latest_image.get("annotations") or {}).get("detected_conditions", [])

    return {
        "image_url": image_url,
        "detected_conditions": detected_conditions,
        "original_image_url": original_url,
    }


# ------------------
# Analysis attachment
# ------------------

async def _persist_image_document(db, patient_oid, analysis_id, filename, folder, image_type, annotations=None):
    """Insert or refresh the Image document describing a file on disk.

    Dimensions, size and MIME type are read from the file here rather than
    taken from the request: the client only supplies a filename, so none of
    the stored metadata depends on it being honest.
    """
    file_path = os.path.join(folder, filename)

    img = cv2.imread(file_path)
    height, width = img.shape[:2] if img is not None else (None, None)

    # Validate through the model so a malformed document can never reach the
    # collection, then write the plain BSON types the readers expect.
    image = Image(
        patient_id=patient_oid,
        analysis_id=analysis_id,
        image_type=image_type,
        filename=filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        mime_type=mimetypes.guess_type(filename)[0] or "image/jpeg",
        width=width,
        height=height,
        annotations=annotations,
    )

    document = {
        "patient_id": image.patient_id,
        "analysis_id": image.analysis_id,
        "image_type": image.image_type.value,
        "filename": image.filename,
        "file_path": image.file_path,
        "file_size": image.file_size,
        "mime_type": image.mime_type,
        "width": image.width,
        "height": image.height,
        "uploaded_at": image.uploaded_at,
        "annotations": image.annotations,
    }

    # One original and one annotated per run. Re-attaching the same analysis
    # updates that run's rows in place instead of adding to them; a genuinely
    # new run has a new analysis_id and so gets its own pair.
    await db.images.update_one(
        {
            "patient_id": patient_oid,
            "analysis_id": analysis_id,
            "image_type": document["image_type"],
        },
        {"$set": document},
        upsert=True,
    )
    return document


@app.post("/patients/{patient_id}/analysis")
async def attach_analysis_to_patient(patient_id: str, payload: dict, db=Depends(get_database)):
    """Bind an already-completed /predict run to a patient record.

    /predict runs before the patient exists - the UI collects the radiograph
    on /upload and creates the record on /patient-data - so it cannot know
    which patient the image belongs to. This endpoint is the join: the
    frontend calls it as soon as POST /patients returns an id, echoing back
    the filenames and detections /predict produced. Without it nothing is ever
    written to db.detected_conditions or db.images and every read of those two
    collections comes back empty.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    if not patient_id or patient_id == "undefined":
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID")

    raw_detections = payload.get("detections")
    if raw_detections is not None and not isinstance(raw_detections, list):
        raise HTTPException(status_code=400, detail="detections must be a list")
    raw_detections = raw_detections or []

    raw_labels = payload.get("detected_conditions") or []
    if not isinstance(raw_labels, list):
        raise HTTPException(status_code=400, detail="detected_conditions must be a list")

    # A client that only has the legacy string list still gets its findings
    # stored, just without confidence or coordinates.
    if not raw_detections:
        raw_detections = [{"condition_type": label} for label in raw_labels if isinstance(label, str)]

    output_image = payload.get("output_image")
    input_image = payload.get("input_image")

    if not raw_detections and not output_image and not input_image:
        # Refuse an empty body outright rather than silently wiping whatever
        # analysis is already on file for this patient.
        raise HTTPException(status_code=400, detail="No analysis data supplied")

    patient_oid = ObjectId(patient_id)
    patient = await db.patients.find_one({"_id": patient_oid})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    annotated_filename = resolve_stored_file(output_image, PREDICTION_FOLDER)
    original_filename = resolve_stored_file(input_image, UPLOAD_FOLDER)

    if output_image and not annotated_filename:
        logging.warning(f"Annotated image {output_image!r} not usable for patient {patient_id}")
    if input_image and not original_filename:
        logging.warning(f"Original image {input_image!r} not usable for patient {patient_id}")

    # The run's identity. /predict stamps a unique 12-hex id into the name it
    # writes, so the filename already distinguishes one run from another -
    # which makes a repeated attach of the SAME run (a retried request, say)
    # update that run rather than fork a duplicate. With no usable filename
    # there is nothing to recognise the run by, so it can only be a new one.
    analysis_key = annotated_filename or original_filename or f"detections-only-{uuid.uuid4().hex}"

    existing_analysis = await db.analyses.find_one({
        "patient_id": patient_oid,
        "analysis_key": analysis_key,
    })
    analysis_id = existing_analysis["_id"] if existing_analysis else ObjectId()

    condition_documents = []
    stored_condition_types = []
    skipped_labels = []

    for detection in raw_detections:
        if not isinstance(detection, dict):
            continue

        raw_label = detection.get("condition_type") or detection.get("label")
        condition_type = normalise_condition_label(raw_label)
        if condition_type is None:
            skipped_labels.append(raw_label)
            continue

        confidence = detection.get("confidence")
        if confidence is None:
            confidence = detection.get("confidence_score")

        try:
            condition = DetectedCondition(
                patient_id=patient_oid,
                analysis_id=analysis_id,
                condition_type=condition_type,
                confidence_score=_as_confidence(confidence),
                bounding_box=_as_bounding_box(detection.get("bounding_box")),
            )
        except ValidationError as exc:
            logging.warning(f"Skipping invalid detection for patient {patient_id}: {exc}")
            skipped_labels.append(raw_label)
            continue

        condition_documents.append({
            "_id": ObjectId(),
            # ObjectId, because every existing reader of this collection -
            # main.py and pdf_api alike - queries it with ObjectId(patient_id).
            "patient_id": condition.patient_id,
            "analysis_id": condition.analysis_id,
            "condition_type": condition.condition_type.value,
            "confidence_score": condition.confidence_score,
            "bounding_box": condition.bounding_box,
            "description": condition.description,
            "detected_at": condition.detected_at,
        })
        stored_condition_types.append(condition.condition_type.value)

    if skipped_labels:
        logging.warning(
            f"Ignored {len(skipped_labels)} unrecognised condition label(s) "
            f"for patient {patient_id}: {skipped_labels}"
        )

    # Scoped to this run only: earlier analyses stay on file, so the patient
    # keeps a full history of what the model reported and when. The delete is
    # what makes a repeated attach of the same run idempotent rather than
    # doubling its detections.
    await db.detected_conditions.delete_many({
        "patient_id": patient_oid,
        "analysis_id": analysis_id,
    })
    if condition_documents:
        await db.detected_conditions.insert_many(condition_documents)

    unique_conditions = _dedupe(stored_condition_types)

    # The Analysis document is what the scoped reads resolve. It has to exist
    # even for a run that detected nothing: without it, a clean radiograph
    # would fall through to the previous run and report findings the model did
    # not make this time.
    analysis = Analysis(
        patient_id=patient_oid,
        analysis_key=analysis_key,
        source_filename=original_filename,
        annotated_filename=annotated_filename,
        detected_conditions=unique_conditions,
        condition_count=len(condition_documents),
    )
    await db.analyses.update_one(
        {"patient_id": patient_oid, "analysis_key": analysis_key},
        {
            "$set": {
                "patient_id": analysis.patient_id,
                "analysis_key": analysis.analysis_key,
                "source_filename": analysis.source_filename,
                "annotated_filename": analysis.annotated_filename,
                "detected_conditions": [c.value for c in analysis.detected_conditions],
                "condition_count": analysis.condition_count,
            },
            # Re-attaching must not reorder history by refreshing created_at.
            "$setOnInsert": {"_id": analysis_id, "created_at": analysis.created_at},
        },
        upsert=True,
    )

    annotated_url = None
    original_url = None

    if original_filename:
        await _persist_image_document(
            db, patient_oid, analysis_id, original_filename, UPLOAD_FOLDER, "original"
        )
        original_url = f"/api/uploads/{original_filename}"

    if annotated_filename:
        await _persist_image_document(
            db, patient_oid, analysis_id, annotated_filename, PREDICTION_FOLDER, "annotated",
            annotations={
                "detected_conditions": unique_conditions,
                "detections": [
                    {
                        "condition_type": doc["condition_type"],
                        "confidence_score": doc["confidence_score"],
                        "bounding_box": doc["bounding_box"],
                    }
                    for doc in condition_documents
                ],
                "source_filename": original_filename,
            },
        )
        annotated_url = f"/api/outputs/predictions/{annotated_filename}"

    logging.info(
        f"Attached analysis {analysis_id} to patient {patient_id}: "
        f"{len(condition_documents)} condition(s), "
        f"annotated={bool(annotated_url)}, original={bool(original_url)}, "
        f"{'updated existing run' if existing_analysis else 'new run'}"
    )

    return {
        "patient_id": patient_id,
        "analysis_id": str(analysis_id),
        "conditions_stored": len(condition_documents),
        "detected_conditions": unique_conditions,
        "annotated_image_url": annotated_url,
        "original_image_url": original_url,
        "skipped_labels": [label for label in skipped_labels if isinstance(label, str)],
        "message": "Analysis attached to patient",
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
                # Fall back to previously stored detections only - never invent
                # a condition the model did not actually report.
                # Scoped to the current radiograph: an older run's findings
                # must not drive a treatment plan for the image on file now.
                latest_analysis = await get_latest_analysis(db, ObjectId(patient_id))
                conditions_cursor = db.detected_conditions.find(
                    scoped_to_analysis(ObjectId(patient_id), latest_analysis)
                )
                stored_conditions = []
                async for condition in conditions_cursor:
                    stored_conditions.append(condition["condition_type"])

                # One document is stored per detection box, so a radiograph
                # with four caries yields four rows; the engine wants the
                # distinct conditions, not their multiplicity.
                detected_conditions = _dedupe(stored_conditions)

        if not detected_conditions:
            # No findings is a valid clinical result: return an empty plan
            # rather than a treatment for a fabricated diagnosis.
            logging.info(f"No detected conditions for patient {patient_id}; returning empty plan")

            if db is not None:
                # Retract the plan on file as well. This branch returns before
                # the engine runs, so _store_recommendations - which is what
                # normally replaces a patient's recommendations - never fires,
                # and a plan generated from a radiograph that has since been
                # superseded would keep being served by GET /recommendations.
                # The report would then show a full treatment plan directly
                # beneath "No abnormalities detected".
                #
                # patient_id stays a string here: recommendation_engine writes
                # and queries this collection with the string, unlike
                # detected_conditions and images which use ObjectId.
                cleared = await db.recommendations.delete_many({"patient_id": patient_id})
                if getattr(cleared, "deleted_count", 0):
                    logging.info(
                        f"Cleared {cleared.deleted_count} stale recommendation(s) "
                        f"for patient {patient_id}: the current analysis found nothing"
                    )

            return {
                "patient_id": patient_id,
                "detected_conditions": [],
                "recommendations": [],
                "generated_at": datetime.utcnow().isoformat(),
                "engine_version": "1.0",
                "message": "No conditions were detected, so no treatment recommendations were generated."
            }

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

    except HTTPException:
        # Preserve the 400/404 the validation above already decided on
        raise
    except ValueError as ve:
        logging.error(f"Validation error in AI recommendations: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.exception(f"Error generating AI recommendations: {e}")
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

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching AI recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch recommendations")
