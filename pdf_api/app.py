from flask import Flask, send_file, request, jsonify
from flask_cors import CORS
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
import io
import re
import requests
import time
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

# ✅ Allow all origins (or restrict to your Next.js origin if you prefer)
CORS(app, resources={r"/*": {"origins": "*"}})

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

def download_and_resize_image(url_or_data, max_width=5*cm, max_height=5*cm):
    """Download image from URL or process base64 data and resize it to fit within max dimensions."""
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

        # Resize maintaining aspect ratio
        if img.width > max_width or img.height > max_height:
            if aspect_ratio > 1:  # Wider than tall
                new_width = min(max_width, img.width)
                new_height = new_width / aspect_ratio
            else:  # Taller than wide
                new_height = min(max_height, img.height)
                new_width = new_height * aspect_ratio

            img = img.resize((int(new_width), int(new_height)), Image.Resampling.LANCZOS)

        # Convert back to bytes
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG', quality=95)  # Higher quality
        img_buffer.seek(0)
        print("DEBUG: Image processed successfully")
        return img_buffer
    except Exception as e:
        print(f"Error downloading/resizing image: {e}")
        import traceback
        print("Image processing traceback:", traceback.format_exc())
        return None

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "PDF API is running", "endpoints": ["/add_patient (POST)", "/patients (GET)", "/patient/<id> (GET)", "/patient/<id> (DELETE)", "/generate-report (POST)", "/generate-report/<patient_id> (GET)", "/test-pdf (GET)"]})

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
        return jsonify({"error": str(e)}), 500

@app.route("/patients", methods=["GET"])
def get_patients():
    try:
        db = get_db()
        patients = list(db.patients.find({}, {"_id": 1, "name": 1, "diagnosis": 1, "recommendation": 1}))
        for patient in patients:
            patient["_id"] = str(patient["_id"])
        return jsonify(patients), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
        return jsonify({"error": str(e)}), 500

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
        return jsonify({"error": str(e)}), 500

@app.route("/test-pdf", methods=["GET"])
def test_pdf():
    """Generate a simple test PDF to verify the system works."""
    try:
        print("DEBUG: Generating test PDF")
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Simple test content
        c.drawString(100, height - 100, "Test PDF Generation")
        c.drawString(100, height - 120, "This is a test PDF to verify the system works.")
        c.drawString(100, height - 140, f"Generated at: {time.strftime('%Y-%m-%d %H:%M:%S')}")

        c.save()
        buffer.seek(0)

        # Return PDF directly from buffer
        from flask import Response
        pdf_data = buffer.getvalue()

        response = Response(
            pdf_data,
            mimetype="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=Test_PDF.pdf",
                "Content-Length": len(pdf_data)
            }
        )
        return response

    except Exception as e:
        print(f"Test PDF error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/generate-report", methods=["POST", "OPTIONS"])
def generate_report():
    print(f"DEBUG: Received {request.method} request to /generate-report")
    print(f"DEBUG: Headers: {dict(request.headers)}")

    if request.method == "OPTIONS":
        # Handle CORS preflight request
        print("DEBUG: Handling CORS preflight request")
        response = jsonify({"message": "CORS preflight"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response, 200
    try:
        print("DEBUG: Starting PDF generation")

        # Parse JSON data
        data = request.get_json()
        if not data or not isinstance(data, dict):
            return jsonify({"error": "No valid data provided"}), 400

        patient_data = data.get("patientData", {}) or {}
        detected_conditions = data.get("detectedConditions", []) or []
        recommendations = data.get("recommendations", []) or []
        uploaded_image_url = data.get("uploadedImage")
        annotated_image_url = data.get("annotatedImage")
        uploaded_image_data = data.get("uploadedImageData")

        print(f"DEBUG: Patient data: {patient_data}")
        print(f"DEBUG: Detected conditions: {detected_conditions}")
        print(f"DEBUG: Recommendations count: {len(recommendations)}")
        print(f"DEBUG: Uploaded image data present: {bool(uploaded_image_data)}")
        print(f"DEBUG: Annotated image URL: {annotated_image_url}")

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        print("DEBUG: Canvas created")

        # Header
        from reportlab.lib.colors import Color, white, black
        header_blue = Color(0.2, 0.4, 0.8)
        c.setFillColor(header_blue)
        c.rect(0, height - 4*cm, width, 4*cm, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(3*cm, height - 2.5*cm, "DentalAI Prosthetic Report")
        c.setFont("Helvetica", 12)
        patient_info = f"Patient: {patient_data.get('name', 'N/A')} | Age: {patient_data.get('age', 'N/A')} | Gender: {patient_data.get('gender', 'N/A')}"
        c.drawString(3*cm, height - 3.5*cm, patient_info)
        c.setFillColor(black)

        y = height - 6*cm

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
                    c.drawImage(ImageReader(uploaded_img), 2*cm, y - 5*cm, width=5*cm, height=5*cm, mask='auto')
                    c.drawString(10*cm, y, "AI-Analyzed X-ray")
                    c.drawImage(ImageReader(annotated_img), 10*cm, y - 5*cm, width=5*cm, height=5*cm, mask='auto')
                    y -= 6*cm
                elif uploaded_img:
                    print("DEBUG: Drawing uploaded image only")
                    c.setFont("Helvetica", 10)
                    c.drawString(6*cm, y, "Original X-ray")
                    c.drawImage(ImageReader(uploaded_img), 6*cm, y - 5*cm, width=5*cm, height=5*cm, mask='auto')
                    y -= 6*cm
                elif annotated_img:
                    print("DEBUG: Drawing annotated image only")
                    c.setFont("Helvetica", 10)
                    c.drawString(6*cm, y, "AI-Analyzed X-ray")
                    c.drawImage(ImageReader(annotated_img), 6*cm, y - 5*cm, width=5*cm, height=5*cm, mask='auto')
                    y -= 6*cm
                else:
                    print("DEBUG: No images to draw")
            except Exception as img_error:
                print(f"Error drawing images: {img_error}")
                import traceback
                print("Image error traceback:", traceback.format_exc())
            y -= 2*cm

        # Detected Conditions
        if y < 4*cm:
            c.showPage()
            y = height - 2*cm
        c.setFillColor(header_blue)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(3*cm, y, "Detected Conditions:")
        y -= 1.5*cm
        c.setFillColor(black)
        c.setFont("Helvetica", 12)
        if detected_conditions:
            for cond in detected_conditions:
                y = draw_text_with_page_break(c, f"• {cond}", 4*cm, y, width, height)
        else:
            y = draw_text_with_page_break(c, "No abnormalities detected.", 4*cm, y, width, height)

        y -= 1*cm

        # Recommendations
        if y < 6*cm:
            c.showPage()
            y = height - 2*cm
        c.setFillColor(header_blue)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(3*cm, y, "AI Recommendations:")
        y -= 1.5*cm
        c.setFillColor(black)
        c.setFont("Helvetica", 12)
        if recommendations:
            for rec in recommendations:
                if isinstance(rec, dict):
                    box_height = 2*cm
                    if y - box_height < 2*cm:
                        c.showPage()
                        y = height - 2*cm
                    c.setStrokeColor(header_blue)
                    c.setLineWidth(0.5)
                    c.rect(3*cm, y - box_height, width - 6*cm, box_height, fill=0)
                    c.setFillColor(header_blue)
                    c.setFont("Helvetica-Bold", 12)
                    c.drawString(4*cm, y - 0.8*cm, f"{rec.get('type', 'N/A')}")
                    c.setFillColor(black)
                    c.setFont("Helvetica", 10)
                    desc = f"{rec.get('suitability', 0)}% suitability | {rec.get('description', 'N/A')}"
                    c.drawString(4*cm, y - 1.4*cm, desc)
                    cost_duration = f"Cost: {rec.get('cost', 'N/A')} | Duration: {rec.get('duration', 'N/A')}"
                    c.drawString(4*cm, y - 1.8*cm, cost_duration)
                    y -= box_height + 0.5*cm
                else:
                    y = draw_text_with_page_break(c, "Invalid recommendation data", 4*cm, y, width, height)
        else:
            y = draw_text_with_page_break(c, "No recommendations found.", 4*cm, y, width, height)

        print("DEBUG: Saving PDF")
        c.save()
        buffer.seek(0)
        print("DEBUG: PDF saved to buffer")

        # ✅ Use fixed filename to avoid any Windows filename issues
        filename = "DentalAI_Report.pdf"
        print(f"DEBUG: Using fixed filename: {repr(filename)}")

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
        print("Error generating report:", e)
        import traceback
        print("Full traceback:", traceback.format_exc())
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

@app.route("/generate-report/<patient_id>", methods=["GET"])
def generate_report_from_db(patient_id):
    try:
        print(f"DEBUG: Starting PDF generation for patient {patient_id}")

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
        recommendations_docs = list(db.recommendations.find({"patient_id": ObjectId(patient_id)}))
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
            uploaded_image_url = f"http://127.0.0.1:8004/uploads/{original_image['filename']}"

        # Get annotated image
        annotated_image = db.images.find_one({
            "patient_id": ObjectId(patient_id),
            "image_type": "annotated"
        })
        if annotated_image:
            annotated_image_url = f"http://127.0.0.1:8004/outputs/predictions/{annotated_image['filename']}"

        print(f"DEBUG: Patient data: {patient_data}")
        print(f"DEBUG: Detected conditions: {detected_conditions}")
        print(f"DEBUG: Recommendations count: {len(recommendations)}")
        print(f"DEBUG: Uploaded image URL: {uploaded_image_url}")
        print(f"DEBUG: Annotated image URL: {annotated_image_url}")

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        print("DEBUG: Canvas created")

        # Header
        from reportlab.lib.colors import Color, white, black
        header_blue = Color(0.2, 0.4, 0.8)
        c.setFillColor(header_blue)
        c.rect(0, height - 4*cm, width, 4*cm, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 20)
        c.drawString(3*cm, height - 2.5*cm, "DentalAI Prosthetic Report")
        c.setFont("Helvetica", 12)
        patient_info = f"Patient: {patient_data.get('name', 'N/A')} | Age: {patient_data.get('age', 'N/A')} | Gender: {patient_data.get('gender', 'N/A')}"
        c.drawString(3*cm, height - 3.5*cm, patient_info)
        c.setFillColor(black)

        y = height - 6*cm

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
            uploaded_img = None
            annotated_img = None

            try:
                uploaded_img = download_and_resize_image(uploaded_image_data or uploaded_image_url)
            except Exception as e:
                print(f"Error downloading uploaded image: {e}")

            try:
                annotated_img = download_and_resize_image(annotated_image_url)
            except Exception as e:
                print(f"Error downloading annotated image: {e}")

            print(f"DEBUG: Images downloaded - uploaded: {uploaded_img is not None}, annotated: {annotated_img is not None}")

            try:
                if uploaded_img and annotated_img:
                    print("DEBUG: Drawing both images")
                    c.setFont("Helvetica", 10)
                    c.drawString(2*cm, y, "Original X-ray")
                    c.drawImage(ImageReader(uploaded_img), 2*cm, y - 5*cm, width=5*cm, height=5*cm, mask='auto')
                    c.drawString(10*cm, y, "AI-Analyzed X-ray")
                    c.drawImage(ImageReader(annotated_img), 10*cm, y - 5*cm, width=5*cm, height=5*cm, mask='auto')
                    y -= 6*cm
                elif uploaded_img:
                    print("DEBUG: Drawing uploaded image only")
                    c.setFont("Helvetica", 10)
                    c.drawString(6*cm, y, "Original X-ray")
                    c.drawImage(ImageReader(uploaded_img), 6*cm, y - 5*cm, width=5*cm, height=5*cm, mask='auto')
                    y -= 6*cm
                elif annotated_img:
                    print("DEBUG: Drawing annotated image only")
                    c.setFont("Helvetica", 10)
                    c.drawString(6*cm, y, "AI-Analyzed X-ray")
                    c.drawImage(ImageReader(annotated_img), 6*cm, y - 5*cm, width=5*cm, height=5*cm, mask='auto')
                    y -= 6*cm
                else:
                    print("DEBUG: No images to draw - skipping image section")
                    # Don't add the image section if no images are available
                    y += 1.5*cm  # Revert the y position change
                    c.setFillColor(black)  # Reset color
                    c.setFont("Helvetica", 12)  # Reset font
            except Exception as img_error:
                print(f"Error drawing images: {img_error}")
                import traceback
                print("Image error traceback:", traceback.format_exc())
                # Continue without images
                y += 1.5*cm  # Revert the y position change
                c.setFillColor(black)  # Reset color
                c.setFont("Helvetica", 12)  # Reset font
        else:
            print("DEBUG: No image URLs provided - skipping image section")

        # Detected Conditions
        if y < 4*cm:
            c.showPage()
            y = height - 2*cm
        c.setFillColor(header_blue)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(3*cm, y, "Detected Conditions:")
        y -= 1.5*cm
        c.setFillColor(black)
        c.setFont("Helvetica", 12)
        if detected_conditions:
            for cond in detected_conditions:
                y = draw_text_with_page_break(c, f"• {cond}", 4*cm, y, width, height)
        else:
            y = draw_text_with_page_break(c, "No abnormalities detected.", 4*cm, y, width, height)

        y -= 1*cm

        # Recommendations
        if y < 6*cm:
            c.showPage()
            y = height - 2*cm
        c.setFillColor(header_blue)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(3*cm, y, "AI Recommendations:")
        y -= 1.5*cm
        c.setFillColor(black)
        c.setFont("Helvetica", 12)
        if recommendations:
            for rec in recommendations:
                if isinstance(rec, dict):
                    box_height = 2*cm
                    if y - box_height < 2*cm:
                        c.showPage()
                        y = height - 2*cm
                    c.setStrokeColor(header_blue)
                    c.setLineWidth(0.5)
                    c.rect(3*cm, y - box_height, width - 6*cm, box_height, fill=0)
                    c.setFillColor(header_blue)
                    c.setFont("Helvetica-Bold", 12)
                    c.drawString(4*cm, y - 0.8*cm, f"{rec.get('type', 'N/A')}")
                    c.setFillColor(black)
                    c.setFont("Helvetica", 10)
                    desc = f"{rec.get('suitability', 0)}% suitability | {rec.get('description', 'N/A')}"
                    c.drawString(4*cm, y - 1.4*cm, desc)
                    cost_duration = f"Cost: {rec.get('cost', 'N/A')} | Duration: {rec.get('duration', 'N/A')}"
                    c.drawString(4*cm, y - 1.8*cm, cost_duration)
                    y -= box_height + 0.5*cm
                else:
                    y = draw_text_with_page_break(c, "Invalid recommendation data", 4*cm, y, width, height)
        else:
            y = draw_text_with_page_break(c, "No recommendations found.", 4*cm, y, width, height)

        print("DEBUG: Saving PDF")
        c.save()
        buffer.seek(0)
        print("DEBUG: PDF saved to buffer")

        # ✅ Use fixed filename to avoid any Windows filename issues
        filename = "DentalAI_Report.pdf"
        print(f"DEBUG: Using fixed filename: {repr(filename)}")

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
        print("Error generating report:", e)
        import traceback
        print("Full traceback:", traceback.format_exc())
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
