from flask import Flask, send_file, request, jsonify
from flask_cors import CORS
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
import io
import json
import os
import re
import requests
import time
import uuid
from PIL import Image
try:
    from database import get_db, is_db_connected
    from bson.objectid import ObjectId
    DB_AVAILABLE = is_db_connected()
    if DB_AVAILABLE:
        print("Database available for PDF API")
    else:
        print("Database not available - PDF API will work without database connection")
except Exception as e:
    print(f"Database import failed: {e}")
    DB_AVAILABLE = False
    get_db = None
    is_db_connected = None

app = Flask(__name__)

# Allow all origins (or restrict to your Next.js origin if you prefer)
CORS(app, resources={r"/*": {"origins": "*"}})

# Metrics are read from the file DentalAI-Backend/evaluate_model.py writes.
# They are never hardcoded here: this report previously printed "Model
# Accuracy: 91.3%", "mAP@0.5: 0.87", "Precision: 0.89" and "Recall: 0.85",
# none of which were measured and none of which matched the model.
MODEL_METRICS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "DentalAI-Backend", "model_metrics.json",
)


def load_model_metrics(path=MODEL_METRICS_PATH):
    """Return the recorded metrics, or None if the model has not been evaluated."""
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return None


def server_error(context, exc, status=500):
    """Log full detail server-side; return an opaque error to the client.

    Returning str(exc) - let alone traceback.format_exc() - hands anyone who
    can reach the endpoint our filesystem paths, the MongoDB URI (pymongo
    embeds it in connection errors) and the internal call structure. The
    error_id lets a user quote the failure without us disclosing any of that.
    """
    error_id = uuid.uuid4().hex[:8]
    app.logger.exception("[%s] %s: %s", error_id, context, exc)
    return jsonify({
        "error": "Internal server error. Please contact the administrator.",
        "error_id": error_id,
    }), status


def sanitize_filename(name):
    """Sanitize filename to remove invalid characters for Windows and Linux."""
    if not name:
        return "Patient"
    # Remove invalid characters for Windows: < > : " / \ | ? *
    # Also remove other problematic chars for filenames
    sanitized = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', str(name))
    # Replace spaces and other whitespace with underscores
    sanitized = re.sub(r'\s+', '_', sanitized)
    # Remove leading/trailing dots and spaces
    sanitized = sanitized.strip('._')
    # Ensure it's not empty
    if not sanitized:
        sanitized = "Patient"
    # Limit length to prevent issues (Windows has 255 char limit for filenames)
    if len(sanitized) > 100:
        sanitized = sanitized[:100].rstrip('._')
    return sanitized

def draw_text_with_page_break(c, text, x, y, width, height, font_size=12):
    """Draw text and handle page breaks if necessary."""
    c.setFont("Helvetica", font_size)
    lines = text.split('\n')
    for line in lines:
        if y < 2*cm:
            c.showPage()
            c.setFont("Helvetica", font_size)
            y = height - 2*cm
        c.drawString(x, y, line)
        y -= 1*cm
    return y

# Points-per-inch used by ReportLab; radiographs are resampled for this DPI so
# the model's annotation boxes stay legible in the printed report.
PDF_TARGET_DPI = 200


def download_and_resize_image(url_or_data, max_width=5*cm, max_height=5*cm):
    """Download or decode an image and resample it for the PDF.

    Returns ``(buffer, aspect_ratio)`` so the caller can draw it without
    distorting it, or ``None`` if the image could not be obtained.

    ``max_width``/``max_height`` are ReportLab points (the size the image will
    occupy on the page); they are converted to a pixel budget at
    ``PDF_TARGET_DPI`` before resampling. Comparing them against pixel counts
    directly - as this function used to - downsampled a 2048px radiograph to
    roughly 142px.
    """
    print(f"DEBUG: download_and_resize_image called with: {repr(url_or_data[:100] if url_or_data else None)}...")
    if not url_or_data or url_or_data.startswith('blob:'):
        print("DEBUG: Returning None - no data or blob URL")
        return None
    try:
        if url_or_data.startswith('data:'):
            print("DEBUG: Processing base64 data")
            # Handle base64 data
            import base64
            header, encoded = url_or_data.split(",", 1)
            img_data = base64.b64decode(encoded)
            img = Image.open(io.BytesIO(img_data))
        else:
            # Handle relative /api/ URLs by mapping to internal backend
            if url_or_data.startswith('/api/'):
                url_or_data = f"http://127.0.0.1:8000{url_or_data[4:]}"
            elif url_or_data.startswith('/'):
                url_or_data = f"http://127.0.0.1:8000{url_or_data}"
                
            print(f"DEBUG: Downloading from URL: {url_or_data}")
            # Handle URL
            response = requests.get(url_or_data, timeout=10)
            response.raise_for_status()
            img = Image.open(io.BytesIO(response.content))

        # Convert to RGB if necessary (for JPEG compatibility)
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Calculate aspect ratio
        aspect_ratio = img.width / img.height

        # Convert the on-page size (points) into a pixel budget at target DPI
        max_px_w = max(1, int(max_width / 72.0 * PDF_TARGET_DPI))
        max_px_h = max(1, int(max_height / 72.0 * PDF_TARGET_DPI))

        # Resize maintaining aspect ratio, never scaling up
        scale = min(max_px_w / img.width, max_px_h / img.height, 1.0)
        if scale < 1.0:
            new_width = max(1, int(img.width * scale))
            new_height = max(1, int(img.height * scale))
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Convert back to bytes
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG', quality=95)  # Higher quality
        img_buffer.seek(0)
        print(f"DEBUG: Image processed successfully ({img.width}x{img.height})")
        return img_buffer, aspect_ratio
    except Exception as e:
        print(f"Error downloading/resizing image: {e}")
        import traceback
        print("Image processing traceback:", traceback.format_exc())
        return None

def draw_image_fitted(c, image, x, bottom, box_w, box_h):
    """Draw a (buffer, aspect_ratio) pair centred inside a box, undistorted.

    Forcing a fixed width and height - as the report used to - squeezes a
    panoramic radiograph (roughly 2:1) into a square and misrepresents the
    anatomy and the annotation boxes drawn on it.
    """
    buffer, aspect_ratio = image
    draw_w = box_w
    draw_h = box_w / aspect_ratio
    if draw_h > box_h:
        draw_h = box_h
        draw_w = box_h * aspect_ratio

    off_x = x + (box_w - draw_w) / 2
    off_y = bottom + (box_h - draw_h) / 2

    buffer.seek(0)
    c.drawImage(ImageReader(buffer), off_x, off_y, width=draw_w, height=draw_h, mask='auto')


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "PDF API is running", "endpoints": ["/add_patient (POST)", "/patients (GET)", "/patient/<id> (GET)", "/patient/<id> (DELETE)", "/generate-report/<patient_id> (POST/GET)", "/test-pdf (GET)"]})

@app.route("/add_patient", methods=["POST"])
def add_patient():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        db = get_db()
        result = db.patients.insert_one(data)
        return jsonify({"message": "Patient added successfully", "id": str(result.inserted_id)}), 201
    except Exception as e:
        return server_error("add_patient", e)

@app.route("/patients", methods=["GET"])
def get_patients():
    try:
        db = get_db()
        patients = list(db.patients.find({}, {"_id": 1, "name": 1, "diagnosis": 1, "recommendation": 1}))
        for patient in patients:
            patient["_id"] = str(patient["_id"])
        return jsonify(patients), 200
    except Exception as e:
        return server_error("get_patients", e)

@app.route("/patient/<id>", methods=["GET"])
def get_patient(id):
    try:
        db = get_db()
        patient = db.patients.find_one({"_id": ObjectId(id)})
        if patient:
            patient["_id"] = str(patient["_id"])
            return jsonify(patient), 200
        else:
            return jsonify({"error": "Patient not found"}), 404
    except Exception as e:
        return server_error("get_patient", e)

@app.route("/patient/<id>", methods=["DELETE"])
def delete_patient(id):
    try:
        db = get_db()
        result = db.patients.delete_one({"_id": ObjectId(id)})
        if result.deleted_count > 0:
            return jsonify({"message": "Patient deleted successfully"}), 200
        else:
            return jsonify({"error": "Patient not found"}), 404
    except Exception as e:
        return server_error("delete_patient", e)

@app.route("/test-pdf", methods=["GET"])
def test_pdf():
    """Generate a test PDF with AI model performance metrics."""
    try:
        print("DEBUG: Generating test PDF with model metrics")
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Header
        from reportlab.lib.colors import Color, white, black
        header_blue = Color(0.2, 0.4, 0.8)
        c.setFillColor(header_blue)
        c.rect(0, height - 4*cm, width, 4*cm, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(3*cm, height - 2.5*cm, "DentalAI Model Performance Report")
        c.setFont("Helvetica", 12)
        c.drawString(3*cm, height - 3.5*cm, f"Generated at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        c.setFillColor(black)

        y = height - 6*cm

        # AI Model Performance Metrics
        try:
            print("DEBUG: Starting AI Model Performance Metrics section")
            c.setFillColor(header_blue)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(3*cm, y, "AI Model Performance Metrics:")
            print(f"DEBUG: Drew header, y={y}")
            y -= 1.5*cm
            c.setFillColor(black)
            c.setFont("Helvetica", 12)

            metrics = load_model_metrics()
            if not metrics:
                c.drawString(4*cm, y, "Model has not been evaluated.")
                y -= 0.5*cm
                c.setFont("Helvetica-Oblique", 10)
                c.drawString(4*cm, y, "Run: python DentalAI-Backend/evaluate_model.py --data <data.yaml>")
                y -= 0.5*cm
            else:
                overall = metrics.get("overall", {})
                c.drawString(4*cm, y, f"mAP@0.5: {overall.get('mAP50', 0):.3f}")
                y -= 0.5*cm
                c.drawString(4*cm, y, f"mAP@0.5:0.95: {overall.get('mAP50_95', 0):.3f}")
                y -= 0.5*cm
                c.drawString(4*cm, y, f"Precision: {overall.get('precision', 0):.3f}")
                y -= 0.5*cm
                c.drawString(4*cm, y, f"Recall: {overall.get('recall', 0):.3f}")
                y -= 0.7*cm

                # Provenance: a metric with no stated source is not a metric.
                c.setFont("Helvetica-Oblique", 9)
                c.drawString(4*cm, y, f"Measured on the '{metrics.get('split', '?')}' split of "
                                      f"{metrics.get('dataset', 'the dataset')} "
                                      f"({metrics.get('images', '?')} images), "
                                      f"{str(metrics.get('evaluated_at', ''))[:10]}.")
                y -= 0.5*cm
                c.drawString(4*cm, y, "Per-class performance varies substantially; see model_metrics.json.")
                y -= 0.5*cm
            print("DEBUG: Completed AI Model Performance Metrics section")
        except Exception as e:
            print(f"ERROR in AI Model Performance Metrics section: {e}")
            import traceback
            print("Traceback:", traceback.format_exc())

        c.save()
        buffer.seek(0)

        # Return PDF directly from buffer
        from flask import Response
        pdf_data = buffer.getvalue()

        response = Response(
            pdf_data,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=DentalAI_Model_Performance_Test.pdf",
                "Content-Length": len(pdf_data)
            }
        )
        return response

    except Exception as e:
        return server_error("test_pdf", e)

@app.route("/generate-report/<patient_id>", methods=["GET", "POST", "OPTIONS"])
def generate_report_from_db(patient_id):
    try:
        print(f"DEBUG: Starting PDF generation for patient {patient_id}")

        if request.method == "OPTIONS":
            response = jsonify({"message": "CORS preflight"})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type")
            return response, 200

        if request.method == "POST":
            print("DEBUG: Handling POST request")
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
            patient_data = data.get("patientData", {})
            detected_conditions = data.get("detectedConditions", [])
            recommendations = data.get("recommendations", [])
            uploaded_image_data = data.get("uploadedImageData")
            annotated_image_url = data.get("annotatedImage")
            uploaded_image_url = data.get("uploadedImage")
        else:
            if not DB_AVAILABLE:
                return jsonify({"error": "Database not available"}), 503

            # Fetch patient data from MongoDB
            db = get_db()
            patient = db.patients.find_one({"_id": ObjectId(patient_id)})
            if not patient:
                return jsonify({"error": "Patient not found"}), 404

            # Convert ObjectId to string for JSON serialization
            patient["_id"] = str(patient["_id"])
            patient_data = {
                "name": patient.get("name", "N/A"),
                "age": patient.get("age", "N/A"),
                "gender": patient.get("gender", "N/A"),
                "budget": patient.get("budget", 0)
            }

            # Fetch detected conditions from MongoDB
            detected_conditions_docs = list(db.detected_conditions.find({"patient_id": ObjectId(patient_id)}))
            detected_conditions = [doc.get("condition_type", "Unknown") for doc in detected_conditions_docs] if detected_conditions_docs else []
            print(f"DEBUG: Found {len(detected_conditions_docs)} detected conditions: {detected_conditions}")

            # Fetch recommendations from MongoDB
            # recommendation_engine._store_recommendations writes patient_id as
            # a string, so querying with ObjectId here matched nothing and the
            # report came out with an empty recommendations section.
            recommendations_docs = list(db.recommendations.find({"patient_id": str(patient_id)}))
            recommendations = []
            for rec in recommendations_docs:
                recommendations.append({
                    "type": rec.get("treatment_type", "N/A"),
                    "description": rec.get("rationale", "N/A"),
                    "cost": rec.get("cost_estimate", "N/A"),
                    "duration": rec.get("duration", "N/A"),
                    "suitability": rec.get("suitability_score", 0)
                })

            # Fetch image URLs from MongoDB
            uploaded_image_url = None
            annotated_image_url = None
            uploaded_image_data = None

            # Get original image
            original_image = db.images.find_one({
                "patient_id": ObjectId(patient_id),
                "image_type": "original"
            })
            if original_image:
                uploaded_image_url = f"http://127.0.0.1:8000/uploads/{original_image['filename']}"

            # Get annotated image
            annotated_image = db.images.find_one({
                "patient_id": ObjectId(patient_id),
                "image_type": "annotated"
            })
            if annotated_image:
                annotated_image_url = f"http://127.0.0.1:8000/outputs/predictions/{annotated_image['filename']}"

        print(f"DEBUG: Patient data: {patient_data}")
        print(f"DEBUG: Detected conditions: {detected_conditions}")
        print(f"DEBUG: Recommendations count: {len(recommendations)}")
        print(f"DEBUG: Uploaded image URL: {uploaded_image_url}")
        print(f"DEBUG: Annotated image URL: {annotated_image_url}")
        print(f"DEBUG: Uploaded image data present: {bool(uploaded_image_data)}")

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        print("DEBUG: Canvas created")

        # Header - matching the preview design
        from reportlab.lib.colors import Color, white, black, gray
        header_blue = Color(0.2, 0.4, 0.8)
        c.setFillColor(header_blue)
        c.rect(0, height - 3*cm, width, 3*cm, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 24)
        c.drawString(3*cm, height - 2*cm, "DentalAI Prosthetic Report")
        c.setFont("Helvetica", 12)
        c.drawString(3*cm, height - 2.5*cm, f"Generated on {time.strftime('%B %d, %Y')}")
        c.setFillColor(black)

        y = height - 5*cm

        # Patient Information Section - matching preview
        c.setFillColor(header_blue)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(3*cm, y, "Patient Information")
        y -= 1.5*cm
        c.setFillColor(black)
        c.setFont("Helvetica", 12)

        # Create a grid-like layout for patient info
        patient_info_x = 4*cm
        info_y = y

        # Left column
        c.setFont("Helvetica-Bold", 12)
        c.drawString(patient_info_x, info_y, "Name:")
        c.setFont("Helvetica", 12)
        c.drawString(patient_info_x + 3*cm, info_y, str(patient_data.get('name', 'N/A')))

        c.setFont("Helvetica-Bold", 12)
        c.drawString(patient_info_x, info_y - 0.8*cm, "Age:")
        c.setFont("Helvetica", 12)
        c.drawString(patient_info_x + 3*cm, info_y - 0.8*cm, f"{patient_data.get('age', 'N/A')} years")

        # Right column
        c.setFont("Helvetica-Bold", 12)
        c.drawString(patient_info_x + 8*cm, info_y, "Gender:")
        c.setFont("Helvetica", 12)
        c.drawString(patient_info_x + 11*cm, info_y, str(patient_data.get('gender', 'N/A')))

        c.setFont("Helvetica-Bold", 12)
        c.drawString(patient_info_x + 8*cm, info_y - 0.8*cm, "Budget:")
        c.setFont("Helvetica", 12)
        budget = patient_data.get('budget', 0)
        c.drawString(patient_info_x + 11*cm, info_y - 0.8*cm, f"LKR {budget:,}")

        y = info_y - 2.5*cm

        # X-Ray Images
        if uploaded_image_url or annotated_image_url or uploaded_image_data:
            print("DEBUG: Processing images section")
            if y < 10*cm:
                c.showPage()
                y = height - 2*cm
            c.setFillColor(header_blue)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(3*cm, y, "X-ray Comparison:")
            y -= 1.5*cm

            print("DEBUG: Downloading images")
            uploaded_img = download_and_resize_image(uploaded_image_data or uploaded_image_url)
            annotated_img = download_and_resize_image(annotated_image_url)
            print(f"DEBUG: Images downloaded - uploaded: {uploaded_img is not None}, annotated: {annotated_img is not None}")

            try:
                if uploaded_img and annotated_img:
                    print("DEBUG: Drawing both images")
                    c.setFont("Helvetica", 10)
                    c.drawString(2*cm, y, "Original X-ray")
                    draw_image_fitted(c, uploaded_img, 2*cm, y - 5*cm, 5*cm, 5*cm)
                    c.drawString(10*cm, y, "AI-Analyzed X-ray")
                    draw_image_fitted(c, annotated_img, 10*cm, y - 5*cm, 5*cm, 5*cm)
                    y -= 6*cm
                elif uploaded_img:
                    print("DEBUG: Drawing uploaded image only")
                    c.setFont("Helvetica", 10)
                    c.drawString(6*cm, y, "Original X-ray")
                    draw_image_fitted(c, uploaded_img, 6*cm, y - 5*cm, 5*cm, 5*cm)
                    y -= 6*cm
                elif annotated_img:
                    print("DEBUG: Drawing annotated image only")
                    c.setFont("Helvetica", 10)
                    c.drawString(6*cm, y, "AI-Analyzed X-ray")
                    draw_image_fitted(c, annotated_img, 6*cm, y - 5*cm, 5*cm, 5*cm)
                    y -= 6*cm
                else:
                    print("DEBUG: No images to draw")
            except Exception as img_error:
                print(f"Error drawing images: {img_error}")
                import traceback
                print("Image error traceback:", traceback.format_exc())
            y -= 2*cm

        # Detected Conditions Section - matching preview design
        if y < 4*cm:
            c.showPage()
            y = height - 2*cm
        c.setFillColor(header_blue)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(3*cm, y, "Detected Conditions")
        y -= 1.5*cm
        c.setFillColor(black)
        c.setFont("Helvetica", 12)
        if detected_conditions:
            for cond in detected_conditions:
                y = draw_text_with_page_break(c, f"• {cond}", 4*cm, y, width, height)
                y -= 0.3*cm  # Small gap between items
        else:
            y = draw_text_with_page_break(c, "No abnormalities detected.", 4*cm, y, width, height)

        y -= 1*cm

        y -= 1*cm

        # AI Recommendations Section - matching preview design
        if y < 6*cm:
            c.showPage()
            y = height - 2*cm
        c.setFillColor(header_blue)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(3*cm, y, "AI Recommendations")
        y -= 1.5*cm
        c.setFillColor(black)
        c.setFont("Helvetica", 12)
        if recommendations:
            for rec in recommendations:
                if isinstance(rec, dict):
                    box_height = 2.5*cm
                    if y - box_height < 2*cm:
                        c.showPage()
                        y = height - 2*cm

                    # Draw recommendation box with light background
                    light_blue = Color(0.9, 0.95, 1.0)
                    c.setFillColor(light_blue)
                    c.setStrokeColor(header_blue)
                    c.setLineWidth(1)
                    c.rect(3*cm, y - box_height, width - 6*cm, box_height, fill=1, stroke=1)

                    # Treatment type and suitability
                    c.setFillColor(header_blue)
                    c.setFont("Helvetica-Bold", 14)
                    c.drawString(4*cm, y - 0.8*cm, f"{rec.get('type', 'N/A')}")
                    c.setFont("Helvetica", 10)
                    c.setFillColor(Color(0.4, 0.4, 0.4))
                    c.drawString(width - 5*cm, y - 0.8*cm, f"{rec.get('suitability', 0)}% suitability")

                    # Description
                    c.setFillColor(Color(0.2, 0.2, 0.2))
                    c.setFont("Helvetica", 11)
                    desc = rec.get('description', 'N/A')
                    # Truncate description if too long
                    if len(desc) > 80:
                        desc = desc[:77] + "..."
                    c.drawString(4*cm, y - 1.4*cm, desc)

                    # Cost and duration
                    c.setFillColor(Color(0.5, 0.5, 0.5))
                    c.setFont("Helvetica", 9)
                    cost_duration = f"Cost: {rec.get('cost', 'N/A')} | Duration: {rec.get('duration', 'N/A')}"
                    c.drawString(4*cm, y - 2*cm, cost_duration)

                    y -= box_height + 0.5*cm
                else:
                    y = draw_text_with_page_break(c, "Invalid recommendation data", 4*cm, y, width, height)
        else:
            y = draw_text_with_page_break(c, "No recommendations found.", 4*cm, y, width, height)

        print("DEBUG: Saving PDF")
        c.save()
        buffer.seek(0)
        print("DEBUG: PDF saved to buffer")

        # Use sanitized filename
        safe_name = sanitize_filename(patient_data.get('name', 'Patient'))
        filename = f"DentalAI_Report_{safe_name}.pdf"
        print(f"DEBUG: Using filename: {repr(filename)}")

        # Return PDF directly from buffer to avoid Windows file handling issues
        from flask import Response
        pdf_data = buffer.getvalue()

        response = Response(
            pdf_data,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": len(pdf_data)
            }
        )
        print("DEBUG: PDF response created successfully")
        return response

    except Exception as e:
        return server_error("generate_report_from_db", e)


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
