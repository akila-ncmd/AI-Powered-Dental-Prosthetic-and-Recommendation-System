"""
Analysis Persistence Tests

Covers the write path that binds an anonymous /predict run to a patient
record, and the reads that were dead code until it existed:

  * POST /predict                      - now carries per-detection detail
  * POST /patients/{id}/analysis       - the only writer of detected_conditions
  * GET  /patients/{id}/conditions     - always returned [] before
  * GET  /patients/{id}/latest-image   - always returned image_url: None before
  * POST /ai-recommendations/{id}      - its stored-conditions fallback

Every run is retained, so the reads are scoped to the patient's most recent
analysis rather than to everything ever detected for them.
"""

import os
import tempfile
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

from app.main import (
    PREDICTION_FOLDER,
    UPLOAD_FOLDER,
    app,
    normalise_condition_label,
    resolve_stored_file,
)

PATIENT_ID = "507f1f77bcf86cd799439011"

# A one-pixel JPEG - small enough to inline, real enough for cv2 to decode.
MINIMAL_JPEG = (
    b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00'
    b'\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19'
    b'\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f'
    b'\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03'
    b'\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
    b'\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
    b'\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00'
    b'\xaa\xff\xd9'
)


def async_cursor(documents):
    """Stand in for a Motor cursor, which is only consumed with `async for`."""
    async def _iterate():
        for document in documents:
            yield document
    return _iterate()


def sorted_cursor(documents):
    """Stand in for cursor.sort(...), which returns the cursor to iterate."""
    cursor = MagicMock()
    cursor.sort = MagicMock(return_value=async_cursor(documents))
    return cursor


def make_db(patient=None, analysis=None, analyses=None):
    """A Motor-shaped mock whose collections are independent of each other.

    `analysis` is what get_latest_analysis resolves to; None means the patient
    has no Analysis document, which is the legacy/unscoped path.
    """
    db = MagicMock()
    db.recommendations.delete_many = AsyncMock(return_value=MagicMock(deleted_count=0))
    db.patients.find_one = AsyncMock(return_value=patient if patient is not None else {"_id": ObjectId(PATIENT_ID)})
    db.analyses.find_one = AsyncMock(return_value=analysis)
    db.analyses.update_one = AsyncMock(return_value=MagicMock(upserted_id=ObjectId()))
    db.analyses.find = MagicMock(return_value=sorted_cursor(analyses or []))
    db.detected_conditions.delete_many = AsyncMock(return_value=MagicMock(deleted_count=0))
    db.detected_conditions.insert_many = AsyncMock(return_value=MagicMock(inserted_ids=[]))
    db.images.update_one = AsyncMock(return_value=MagicMock(upserted_id=ObjectId()))
    db.images.find_one = AsyncMock(return_value=None)
    return db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def stored_files():
    """Two real files, named the way /predict names them, cleaned up after."""
    run_id = "abcdef123456"
    filename = f"xray_{run_id}.jpg"
    created = []
    for folder in (UPLOAD_FOLDER, PREDICTION_FOLDER):
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, filename)
        with open(path, "wb") as handle:
            handle.write(MINIMAL_JPEG)
        created.append(path)
    try:
        yield filename
    finally:
        for path in created:
            try:
                os.unlink(path)
            except OSError:
                pass


class TestConditionLabelNormalisation:
    """The model's label casing must never reach a DetectedCondition raw."""

    @pytest.mark.parametrize("raw,expected", [
        ("Missing teeth", "Missing Teeth"),
        ("Periapical lesion", "Periapical Lesion"),
        ("impacted tooth", "Impacted Tooth"),
        ("Caries", "Caries"),
        ("  bone loss  ", "Bone Loss"),
    ])
    def test_model_labels_map_onto_the_enum(self, raw, expected):
        assert normalise_condition_label(raw) == expected

    @pytest.mark.parametrize("raw", ["", "   ", None, 42, "Sasquatch", "Root Canal"])
    def test_unknown_labels_are_rejected_rather_than_stored(self, raw):
        assert normalise_condition_label(raw) is None


class TestStoredFileResolution:
    """The attach endpoint takes filenames from the client; they are untrusted."""

    def test_exact_filename_is_preserved(self, stored_files):
        assert resolve_stored_file(f"/api/outputs/predictions/{stored_files}", PREDICTION_FOLDER) == stored_files

    def test_query_string_is_stripped(self, stored_files):
        # The frontend appends ?t=<epoch> to bust the browser image cache.
        assert resolve_stored_file(f"/api/outputs/predictions/{stored_files}?t=1700000000", PREDICTION_FOLDER) == stored_files

    @pytest.mark.parametrize("candidate", [
        "../../../../etc/passwd",
        "..\\..\\windows\\system32\\config\\sam",
        "/api/outputs/predictions/../../../app/main.py",
        "..",
        "",
        None,
    ])
    def test_traversal_and_junk_are_refused(self, candidate):
        assert resolve_stored_file(candidate, PREDICTION_FOLDER) is None

    def test_missing_file_is_refused(self):
        assert resolve_stored_file("not_a_real_file_9f3c.jpg", PREDICTION_FOLDER) is None


class TestPredictResponse:
    """The new fields are additive; the three original keys are untouched."""

    def make_upload(self):
        temp_file = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
        temp_file.write(MINIMAL_JPEG)
        temp_file.close()
        return temp_file.name

    def mock_results(self, names, cls, conf=None, xyxy=None):
        result = MagicMock()
        result.names = names
        boxes = MagicMock()
        boxes.cls = cls
        boxes.conf = conf if conf is not None else []
        boxes.xyxy = xyxy if xyxy is not None else []
        result.boxes = boxes
        result.plot.return_value = np.zeros((8, 8, 3), dtype=np.uint8)
        return [result]

    @patch("app.main.model.predict")
    def test_existing_response_shape_is_unchanged(self, mock_predict, client):
        mock_predict.return_value = self.mock_results(
            {0: "Caries", 1: "Missing Teeth"},
            [0, 1],
            conf=[0.91, 0.42],
            xyxy=[[10.0, 20.0, 30.0, 40.0], [50.0, 60.0, 70.0, 80.0]],
        )

        image_path = self.make_upload()
        try:
            with open(image_path, "rb") as handle:
                response = client.post("/predict", files={"file": ("test_xray.jpg", handle, "image/jpeg")})
        finally:
            os.unlink(image_path)

        assert response.status_code == 200
        body = response.json()
        assert body["message"] == "Prediction successful"
        assert sorted(body["detected_conditions"]) == ["Caries", "Missing Teeth"]
        assert body["output_image"].startswith("/api/outputs/predictions/")

    @patch("app.main.model.predict")
    def test_detections_carry_confidence_and_boxes(self, mock_predict, client):
        mock_predict.return_value = self.mock_results(
            {0: "Caries", 1: "Missing teeth"},
            [0, 1],
            conf=[0.91, 0.42],
            xyxy=[[10.0, 20.0, 30.0, 40.0], [50.0, 60.0, 70.0, 80.0]],
        )

        image_path = self.make_upload()
        try:
            with open(image_path, "rb") as handle:
                response = client.post("/predict", files={"file": ("test_xray.jpg", handle, "image/jpeg")})
        finally:
            os.unlink(image_path)

        assert response.status_code == 200
        body = response.json()

        detections = body["detections"]
        assert len(detections) == 2
        assert detections[0] == {
            "label": "Caries",
            "condition_type": "Caries",
            "confidence": pytest.approx(0.91),
            "bounding_box": {"x1": 10.0, "y1": 20.0, "x2": 30.0, "y2": 40.0},
        }
        # The raw label stays in detected_conditions; only the persistable
        # condition_type is normalised.
        assert detections[1]["label"] == "Missing teeth"
        assert detections[1]["condition_type"] == "Missing Teeth"

        # The original upload is addressable so it can be persisted too.
        assert body["input_image"].startswith("/api/uploads/")

    @patch("app.main.model.predict")
    def test_missing_confidence_and_boxes_do_not_break_the_response(self, mock_predict, client):
        # Ultralytics always populates conf/xyxy, but a detection without them
        # must degrade to nulls rather than raise.
        mock_predict.return_value = self.mock_results({0: "Caries"}, [0])

        image_path = self.make_upload()
        try:
            with open(image_path, "rb") as handle:
                response = client.post("/predict", files={"file": ("test_xray.jpg", handle, "image/jpeg")})
        finally:
            os.unlink(image_path)

        assert response.status_code == 200
        detections = response.json()["detections"]
        assert detections == [{
            "label": "Caries",
            "condition_type": "Caries",
            "confidence": None,
            "bounding_box": None,
        }]


class TestAttachAnalysis:
    """POST /patients/{id}/analysis - the write path that closes the gap."""

    def payload(self, filename, **overrides):
        body = {
            "detections": [
                {
                    "label": "Missing teeth",
                    "condition_type": "Missing teeth",
                    "confidence": 0.87,
                    "bounding_box": {"x1": 10.0, "y1": 20.0, "x2": 30.0, "y2": 40.0},
                },
                {"label": "Caries", "condition_type": "Caries", "confidence": 0.55, "bounding_box": None},
            ],
            "detected_conditions": ["Missing teeth", "Caries"],
            "output_image": f"/api/outputs/predictions/{filename}?t=1700000000",
            "input_image": f"/api/uploads/{filename}",
        }
        body.update(overrides)
        return body

    @patch("app.main.Database.get_database")
    def test_conditions_are_stored_with_objectid_and_canonical_labels(self, mock_get_db, client, stored_files):
        db = make_db()
        mock_get_db.return_value = db

        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=self.payload(stored_files))

        assert response.status_code == 200
        body = response.json()
        assert body["conditions_stored"] == 2
        assert body["detected_conditions"] == ["Missing Teeth", "Caries"]

        documents = db.detected_conditions.insert_many.call_args[0][0]
        assert len(documents) == 2

        # The enum is title-cased; writing the model's own "Missing teeth"
        # here fails Pydantic validation. This was a production bug.
        assert documents[0]["condition_type"] == "Missing Teeth"
        assert documents[1]["condition_type"] == "Caries"

        # db.detected_conditions is read with ObjectId(patient_id) everywhere,
        # so it must be written that way and not as a string.
        assert documents[0]["patient_id"] == ObjectId(PATIENT_ID)
        assert isinstance(documents[0]["patient_id"], ObjectId)

        assert documents[0]["confidence_score"] == pytest.approx(0.87)
        assert documents[0]["bounding_box"] == {"x1": 10.0, "y1": 20.0, "x2": 30.0, "y2": 40.0}
        assert documents[1]["bounding_box"] is None

        # Every detection is stamped with the run it came from, which is what
        # lets the reads show the current radiograph without discarding the
        # earlier ones.
        analysis_id = ObjectId(body["analysis_id"])
        assert {doc["analysis_id"] for doc in documents} == {analysis_id}

    @patch("app.main.Database.get_database")
    def test_both_images_are_stored_with_the_exact_filename(self, mock_get_db, client, stored_files):
        db = make_db()
        mock_get_db.return_value = db

        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=self.payload(stored_files))

        assert response.status_code == 200
        body = response.json()

        # Relative URLs only: an absolute 127.0.0.1 URL is unreachable from a
        # browser on any other machine.
        assert body["annotated_image_url"] == f"/api/outputs/predictions/{stored_files}"
        assert body["original_image_url"] == f"/api/uploads/{stored_files}"

        written = {call.args[1]["$set"]["image_type"]: call.args[1]["$set"] for call in db.images.update_one.call_args_list}
        assert set(written) == {"original", "annotated"}

        for image_type, document in written.items():
            # The run id in the filename is what keeps two patients' uploads
            # apart, so the name must be stored verbatim, never recomputed.
            assert document["filename"] == stored_files
            assert document["patient_id"] == ObjectId(PATIENT_ID)
            assert document["analysis_id"] == ObjectId(body["analysis_id"])
            assert document["mime_type"] == "image/jpeg"
            assert document["file_size"] == len(MINIMAL_JPEG)
            assert os.path.isfile(document["file_path"])
            assert "uploaded_at" in document

        annotated = written["annotated"]
        assert annotated["annotations"]["detected_conditions"] == ["Missing Teeth", "Caries"]
        assert len(annotated["annotations"]["detections"]) == 2

    @patch("app.main.Database.get_database")
    def test_the_replace_is_scoped_to_this_run_only(self, mock_get_db, client, stored_files):
        db = make_db()
        mock_get_db.return_value = db

        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=self.payload(stored_files))
        analysis_id = ObjectId(response.json()["analysis_id"])

        # Deleting by patient alone would wipe every earlier run's findings;
        # the history is the point, so only this run's rows are replaced.
        db.detected_conditions.delete_many.assert_awaited_once_with({
            "patient_id": ObjectId(PATIENT_ID),
            "analysis_id": analysis_id,
        })

    @patch("app.main.Database.get_database")
    def test_the_run_is_recorded_as_an_analysis_document(self, mock_get_db, client, stored_files):
        db = make_db()
        mock_get_db.return_value = db

        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=self.payload(stored_files))
        analysis_id = ObjectId(response.json()["analysis_id"])

        selector, update = db.analyses.update_one.call_args.args[:2]
        assert selector == {"patient_id": ObjectId(PATIENT_ID), "analysis_key": stored_files}
        assert db.analyses.update_one.call_args.kwargs["upsert"] is True

        assert update["$set"]["detected_conditions"] == ["Missing Teeth", "Caries"]
        assert update["$set"]["condition_count"] == 2
        assert update["$set"]["annotated_filename"] == stored_files
        assert update["$set"]["source_filename"] == stored_files

        # created_at is set once so a re-attach cannot reorder the history.
        assert update["$setOnInsert"]["_id"] == analysis_id
        assert "created_at" in update["$setOnInsert"]

    @patch("app.main.Database.get_database")
    def test_images_are_upserted_per_run(self, mock_get_db, client, stored_files):
        db = make_db()
        mock_get_db.return_value = db

        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=self.payload(stored_files))
        analysis_id = ObjectId(response.json()["analysis_id"])

        for call in db.images.update_one.call_args_list:
            selector, update = call.args[0], call.args[1]
            # One original and one annotated per run: keyed on the run so a
            # second analysis adds its own pair instead of overwriting this.
            assert selector["patient_id"] == ObjectId(PATIENT_ID)
            assert selector["analysis_id"] == analysis_id
            assert selector["image_type"] in {"original", "annotated"}
            assert "filename" not in selector
            assert call.kwargs["upsert"] is True
            assert "$set" in update

    @patch("app.main.Database.get_database")
    def test_re_attaching_the_same_run_reuses_it_instead_of_forking(self, mock_get_db, client, stored_files):
        existing_id = ObjectId()
        db = make_db()
        # The run is recognised by the unique id /predict stamped into the
        # filename, so a retried request updates it rather than duplicating.
        db.analyses.find_one = AsyncMock(return_value={
            "_id": existing_id,
            "patient_id": ObjectId(PATIENT_ID),
            "analysis_key": stored_files,
        })
        mock_get_db.return_value = db

        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=self.payload(stored_files))

        assert response.json()["analysis_id"] == str(existing_id)
        documents = db.detected_conditions.insert_many.call_args[0][0]
        assert {doc["analysis_id"] for doc in documents} == {existing_id}
        db.detected_conditions.delete_many.assert_awaited_once_with({
            "patient_id": ObjectId(PATIENT_ID),
            "analysis_id": existing_id,
        })

    @patch("app.main.Database.get_database")
    def test_unknown_labels_are_skipped_not_written(self, mock_get_db, client, stored_files):
        db = make_db()
        mock_get_db.return_value = db

        payload = self.payload(stored_files, detections=[
            {"condition_type": "Caries", "confidence": 0.7},
            {"condition_type": "Sasquatch", "confidence": 0.9},
        ])
        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=payload)

        assert response.status_code == 200
        assert response.json()["conditions_stored"] == 1
        assert response.json()["skipped_labels"] == ["Sasquatch"]

        documents = db.detected_conditions.insert_many.call_args[0][0]
        assert [doc["condition_type"] for doc in documents] == ["Caries"]

    @patch("app.main.Database.get_database")
    def test_out_of_range_confidence_is_clamped(self, mock_get_db, client, stored_files):
        db = make_db()
        mock_get_db.return_value = db

        payload = self.payload(stored_files, detections=[
            {"condition_type": "Caries", "confidence": 4.2},
            {"condition_type": "Crown", "confidence": -1},
            {"condition_type": "Filling", "confidence": "not a number"},
        ])
        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=payload)

        assert response.status_code == 200
        documents = db.detected_conditions.insert_many.call_args[0][0]
        assert [doc["confidence_score"] for doc in documents] == [1.0, 0.0, None]

    @patch("app.main.Database.get_database")
    def test_legacy_string_list_is_still_persisted(self, mock_get_db, client, stored_files):
        db = make_db()
        mock_get_db.return_value = db

        payload = self.payload(stored_files, detections=[])
        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=payload)

        assert response.status_code == 200
        documents = db.detected_conditions.insert_many.call_args[0][0]
        assert [doc["condition_type"] for doc in documents] == ["Missing Teeth", "Caries"]
        assert all(doc["confidence_score"] is None for doc in documents)

    @patch("app.main.Database.get_database")
    def test_path_traversal_in_image_urls_is_refused(self, mock_get_db, client, stored_files):
        db = make_db()
        mock_get_db.return_value = db

        payload = self.payload(
            stored_files,
            output_image="/api/outputs/predictions/../../../app/main.py",
            input_image="../../../../etc/passwd",
        )
        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=payload)

        # The detections still persist; the bogus files simply produce no
        # Image document and no URL.
        assert response.status_code == 200
        assert response.json()["annotated_image_url"] is None
        assert response.json()["original_image_url"] is None
        db.images.update_one.assert_not_awaited()

    @patch("app.main.Database.get_database")
    def test_unknown_patient_is_rejected(self, mock_get_db, client, stored_files):
        db = make_db(patient=None)
        db.patients.find_one = AsyncMock(return_value=None)
        mock_get_db.return_value = db

        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=self.payload(stored_files))

        assert response.status_code == 404
        db.detected_conditions.delete_many.assert_not_awaited()

    @patch("app.main.Database.get_database")
    def test_invalid_patient_id_is_rejected(self, mock_get_db, client, stored_files):
        mock_get_db.return_value = make_db()

        for patient_id in ("undefined", "not-an-objectid"):
            response = client.post(f"/patients/{patient_id}/analysis", json=self.payload(stored_files))
            assert response.status_code == 400

    @patch("app.main.Database.get_database")
    def test_empty_payload_does_not_wipe_stored_analysis(self, mock_get_db, client):
        db = make_db()
        mock_get_db.return_value = db

        response = client.post(f"/patients/{PATIENT_ID}/analysis", json={})

        assert response.status_code == 400
        db.detected_conditions.delete_many.assert_not_awaited()

    @patch("app.main.Database.get_database")
    def test_malformed_detections_are_rejected(self, mock_get_db, client):
        mock_get_db.return_value = make_db()

        response = client.post(f"/patients/{PATIENT_ID}/analysis", json={"detections": "Caries"})

        assert response.status_code == 400

    @patch("app.main.Database.get_database", side_effect=ConnectionError("no database"))
    def test_without_a_database_it_degrades_to_503(self, mock_get_db, client, stored_files):
        response = client.post(f"/patients/{PATIENT_ID}/analysis", json=self.payload(stored_files))

        assert response.status_code == 503


class TestReadsAreNoLongerDead:
    """The five read sites returned empty for every patient before this."""

    @patch("app.main.Database.get_database")
    def test_conditions_endpoint_returns_the_stored_detections(self, mock_get_db, client):
        condition_id = ObjectId()
        analysis_id = ObjectId()
        db = make_db(analysis={"_id": analysis_id, "patient_id": ObjectId(PATIENT_ID)})
        db.detected_conditions.find = MagicMock(return_value=async_cursor([{
            "_id": condition_id,
            "patient_id": ObjectId(PATIENT_ID),
            "analysis_id": analysis_id,
            "condition_type": "Missing Teeth",
            "confidence_score": 0.87,
            "bounding_box": {"x1": 10.0, "y1": 20.0, "x2": 30.0, "y2": 40.0},
        }]))
        mock_get_db.return_value = db

        response = client.get(f"/patients/{PATIENT_ID}/conditions")

        assert response.status_code == 200
        assert response.json() == [{
            "id": str(condition_id),
            "condition_type": "Missing Teeth",
            "confidence_score": 0.87,
            "bounding_box": {"x1": 10.0, "y1": 20.0, "x2": 30.0, "y2": 40.0},
            "detected_at": None,
            "analysis_id": str(analysis_id),
        }]

    @patch("app.main.Database.get_database")
    def test_latest_image_returns_working_relative_urls(self, mock_get_db, client):
        db = make_db()

        async def find_one(query, sort=None):
            if query["image_type"] == "annotated":
                return {
                    "filename": "xray_abcdef123456.jpg",
                    "annotations": {"detected_conditions": ["Missing Teeth"]},
                }
            return {"filename": "xray_abcdef123456.jpg"}

        db.images.find_one = AsyncMock(side_effect=find_one)
        mock_get_db.return_value = db

        response = client.get(f"/patients/{PATIENT_ID}/latest-image")

        assert response.status_code == 200
        body = response.json()
        assert body["image_url"] == "/api/outputs/predictions/xray_abcdef123456.jpg"
        assert body["original_image_url"] == "/api/uploads/xray_abcdef123456.jpg"
        assert body["detected_conditions"] == ["Missing Teeth"]

        # Newest-first, so a re-analysed patient does not get an old annotation.
        for call in db.images.find_one.call_args_list:
            assert call.kwargs["sort"] == [("uploaded_at", -1)]

    @patch("app.main.Database.get_database")
    def test_latest_image_survives_a_document_without_annotations(self, mock_get_db, client):
        db = make_db()
        db.images.find_one = AsyncMock(return_value={"filename": "xray_abcdef123456.jpg", "annotations": None})
        mock_get_db.return_value = db

        response = client.get(f"/patients/{PATIENT_ID}/latest-image")

        assert response.status_code == 200
        assert response.json()["detected_conditions"] == []

    @patch("app.main.Database.get_database")
    def test_latest_image_still_reports_no_annotation_when_there_is_none(self, mock_get_db, client):
        db = make_db()
        db.images.find_one = AsyncMock(return_value=None)
        mock_get_db.return_value = db

        response = client.get(f"/patients/{PATIENT_ID}/latest-image")

        assert response.status_code == 200
        assert response.json() == {
            "image_url": None,
            "detected_conditions": [],
            "original_image_url": None,
        }

    @patch("app.main.recommendation_engine.generate_recommendations", new_callable=AsyncMock)
    @patch("app.main.Database.get_database")
    def test_recommendation_fallback_reads_stored_conditions_once_each(
        self, mock_get_db, mock_generate, client
    ):
        db = make_db()
        # One document per detection box: three caries and two missing teeth.
        db.detected_conditions.find = MagicMock(return_value=async_cursor([
            {"condition_type": "Caries"},
            {"condition_type": "Caries"},
            {"condition_type": "Missing Teeth"},
            {"condition_type": "Caries"},
            {"condition_type": "Missing Teeth"},
        ]))
        mock_get_db.return_value = db
        mock_generate.return_value = []

        response = client.post(f"/ai-recommendations/{PATIENT_ID}", json={})

        assert response.status_code == 200
        assert response.json()["detected_conditions"] == ["Caries", "Missing Teeth"]
        mock_generate.assert_awaited_once_with(PATIENT_ID, ["Caries", "Missing Teeth"])


class TestAnalysisHistory:
    """Runs accumulate; the reads show only the current radiograph."""

    OLD_ANALYSIS = ObjectId()
    NEW_ANALYSIS = ObjectId()

    def rows(self, analysis_id, *condition_types):
        return [
            {
                "_id": ObjectId(),
                "patient_id": ObjectId(PATIENT_ID),
                "analysis_id": analysis_id,
                "condition_type": condition_type,
                "confidence_score": 0.8,
                "bounding_box": None,
            }
            for condition_type in condition_types
        ]

    @patch("app.main.Database.get_database")
    def test_conditions_read_is_scoped_to_the_latest_run(self, mock_get_db, client):
        db = make_db(analysis={"_id": self.NEW_ANALYSIS, "patient_id": ObjectId(PATIENT_ID)})
        db.detected_conditions.find = MagicMock(return_value=async_cursor(
            self.rows(self.NEW_ANALYSIS, "Caries")
        ))
        mock_get_db.return_value = db

        response = client.get(f"/patients/{PATIENT_ID}/conditions")

        assert response.status_code == 200
        # The query itself must carry the scope - returning the newest rows by
        # accident of insertion order would not survive a re-analysis.
        assert db.detected_conditions.find.call_args.args[0] == {
            "patient_id": ObjectId(PATIENT_ID),
            "analysis_id": self.NEW_ANALYSIS,
        }
        assert [row["condition_type"] for row in response.json()] == ["Caries"]

    @patch("app.main.Database.get_database")
    def test_a_clean_radiograph_does_not_inherit_the_previous_findings(self, mock_get_db, client):
        # The regression the Analysis document exists to prevent: the newest
        # run detected nothing, so it has no condition rows at all. Without a
        # run marker, "no rows for this analysis" is indistinguishable from
        # "no analysis", and the older run's findings would surface as current.
        db = make_db(analysis={"_id": self.NEW_ANALYSIS, "patient_id": ObjectId(PATIENT_ID)})

        stored = self.rows(self.OLD_ANALYSIS, "Missing Teeth", "Caries")

        def find(query):
            return async_cursor([row for row in stored if row["analysis_id"] == query.get("analysis_id")])

        db.detected_conditions.find = MagicMock(side_effect=find)
        mock_get_db.return_value = db

        response = client.get(f"/patients/{PATIENT_ID}/conditions")

        assert response.status_code == 200
        assert response.json() == []

    @patch("app.main.Database.get_database")
    def test_records_predating_analyses_still_read_back(self, mock_get_db, client):
        # Rows written before runs were tracked have no analysis_id. Scoping
        # them out would silently empty an existing patient's report.
        db = make_db(analysis=None)
        db.detected_conditions.find = MagicMock(return_value=async_cursor([{
            "_id": ObjectId(),
            "patient_id": ObjectId(PATIENT_ID),
            "condition_type": "Bone Loss",
            "confidence_score": None,
            "bounding_box": None,
        }]))
        mock_get_db.return_value = db

        response = client.get(f"/patients/{PATIENT_ID}/conditions")

        assert response.status_code == 200
        assert db.detected_conditions.find.call_args.args[0] == {"patient_id": ObjectId(PATIENT_ID)}
        assert [row["condition_type"] for row in response.json()] == ["Bone Loss"]
        assert response.json()[0]["analysis_id"] is None

    @patch("app.main.Database.get_database")
    def test_both_images_come_from_the_same_run(self, mock_get_db, client):
        db = make_db(analysis={"_id": self.NEW_ANALYSIS, "patient_id": ObjectId(PATIENT_ID)})

        async def find_one(query, sort=None):
            if query.get("analysis_id") != self.NEW_ANALYSIS:
                return None
            name = "current_aaaaaaaaaaaa.jpg"
            if query["image_type"] == "annotated":
                return {"filename": name, "annotations": {"detected_conditions": ["Caries"]}}
            return {"filename": name}

        db.images.find_one = AsyncMock(side_effect=find_one)
        mock_get_db.return_value = db

        response = client.get(f"/patients/{PATIENT_ID}/latest-image")

        assert response.status_code == 200
        body = response.json()
        # Pairing the newest original with the newest annotation independently
        # could show two different X-rays as a before/after of one image.
        assert body["image_url"] == "/api/outputs/predictions/current_aaaaaaaaaaaa.jpg"
        assert body["original_image_url"] == "/api/uploads/current_aaaaaaaaaaaa.jpg"
        for call in db.images.find_one.call_args_list:
            assert call.args[0]["analysis_id"] == self.NEW_ANALYSIS

    @patch("app.main.recommendation_engine.generate_recommendations", new_callable=AsyncMock)
    @patch("app.main.Database.get_database")
    def test_recommendation_fallback_uses_only_the_current_run(self, mock_get_db, mock_generate, client):
        db = make_db(analysis={"_id": self.NEW_ANALYSIS, "patient_id": ObjectId(PATIENT_ID)})

        stored = self.rows(self.OLD_ANALYSIS, "Bone Loss") + self.rows(self.NEW_ANALYSIS, "Caries", "Caries")

        def find(query):
            return async_cursor([row for row in stored if row["analysis_id"] == query.get("analysis_id")])

        db.detected_conditions.find = MagicMock(side_effect=find)
        mock_get_db.return_value = db
        mock_generate.return_value = []

        response = client.post(f"/ai-recommendations/{PATIENT_ID}", json={})

        assert response.status_code == 200
        # "Bone Loss" belongs to a superseded X-ray and must not drive a plan.
        assert response.json()["detected_conditions"] == ["Caries"]
        mock_generate.assert_awaited_once_with(PATIENT_ID, ["Caries"])

    @patch("app.main.Database.get_database")
    def test_the_retained_history_is_readable(self, mock_get_db, client):
        db = make_db(analyses=[
            {
                "_id": self.NEW_ANALYSIS,
                "analysis_key": "current_aaaaaaaaaaaa.jpg",
                "detected_conditions": ["Caries"],
                "condition_count": 2,
                "annotated_filename": "current_aaaaaaaaaaaa.jpg",
                "source_filename": "current_aaaaaaaaaaaa.jpg",
                "created_at": None,
            },
            {
                "_id": self.OLD_ANALYSIS,
                "analysis_key": "earlier_bbbbbbbbbbbb.jpg",
                "detected_conditions": ["Bone Loss"],
                "condition_count": 1,
                "annotated_filename": "earlier_bbbbbbbbbbbb.jpg",
                "source_filename": None,
                "created_at": None,
            },
        ])
        mock_get_db.return_value = db

        response = client.get(f"/patients/{PATIENT_ID}/analyses")

        assert response.status_code == 200
        body = response.json()
        assert body["count"] == 2
        # Newest first, and it names the run every other read is scoped to.
        assert body["latest_analysis_id"] == str(self.NEW_ANALYSIS)
        assert [a["analysis_key"] for a in body["analyses"]] == [
            "current_aaaaaaaaaaaa.jpg",
            "earlier_bbbbbbbbbbbb.jpg",
        ]
        assert body["analyses"][0]["detected_conditions"] == ["Caries"]
        assert body["analyses"][0]["original_image_url"] == "/api/uploads/current_aaaaaaaaaaaa.jpg"
        assert body["analyses"][1]["original_image_url"] is None
        assert db.analyses.find.call_args.args[0] == {"patient_id": ObjectId(PATIENT_ID)}

    @patch("app.main.Database.get_database")
    def test_analyses_listing_is_empty_for_a_patient_with_no_runs(self, mock_get_db, client):
        mock_get_db.return_value = make_db(analyses=[])

        response = client.get(f"/patients/{PATIENT_ID}/analyses")

        assert response.status_code == 200
        assert response.json() == {
            "patient_id": PATIENT_ID,
            "analyses": [],
            "count": 0,
            "latest_analysis_id": None,
        }

    @patch("app.main.Database.get_database")
    def test_analyses_listing_validates_the_patient_id(self, mock_get_db, client):
        mock_get_db.return_value = make_db()

        for patient_id in ("undefined", "not-an-objectid"):
            assert client.get(f"/patients/{patient_id}/analyses").status_code == 400

    @patch("app.main.Database.get_database", side_effect=ConnectionError("no database"))
    def test_analyses_listing_degrades_to_503(self, mock_get_db, client):
        assert client.get(f"/patients/{PATIENT_ID}/analyses").status_code == 503



class TestStalePlanRetraction:
    """A plan must not outlive the findings it was generated from."""

    ANALYSIS = ObjectId()

    @patch("app.main.recommendation_engine.generate_recommendations", new_callable=AsyncMock)
    @patch("app.main.Database.get_database")
    def test_a_clean_reanalysis_retracts_the_stored_plan(self, mock_get_db, mock_generate, client):
        # The current run found nothing, so this branch returns before the
        # engine runs - which means _store_recommendations, the thing that
        # normally replaces a patient's plan, never fires. Left alone, the
        # report shows a full treatment plan under "No abnormalities detected".
        db = make_db(analysis={"_id": self.ANALYSIS, "patient_id": ObjectId(PATIENT_ID)})
        db.detected_conditions.find = MagicMock(return_value=async_cursor([]))
        db.recommendations.delete_many = AsyncMock(return_value=MagicMock(deleted_count=3))
        mock_get_db.return_value = db

        response = client.post(f"/ai-recommendations/{PATIENT_ID}", json={})

        assert response.status_code == 200
        assert response.json()["recommendations"] == []

        # patient_id stays a string: recommendation_engine writes and queries
        # this collection with the string, unlike the other two.
        db.recommendations.delete_many.assert_awaited_once_with({"patient_id": PATIENT_ID})
        assert isinstance(db.recommendations.delete_many.call_args.args[0]["patient_id"], str)

        mock_generate.assert_not_awaited()

    @patch("app.main.recommendation_engine.generate_recommendations", new_callable=AsyncMock)
    @patch("app.main.Database.get_database")
    def test_a_run_with_findings_leaves_the_plan_to_the_engine(self, mock_get_db, mock_generate, client):
        db = make_db(analysis={"_id": self.ANALYSIS, "patient_id": ObjectId(PATIENT_ID)})
        mock_get_db.return_value = db
        mock_generate.return_value = []

        response = client.post(f"/ai-recommendations/{PATIENT_ID}", json={"detected_conditions": ["Caries"]})

        assert response.status_code == 200
        # _store_recommendations already replaces per patient; clearing here
        # too would race it and drop the plan it just wrote.
        db.recommendations.delete_many.assert_not_awaited()

    @patch("app.main.Database.get_database", side_effect=ConnectionError("no database"))
    def test_without_a_database_nothing_is_retracted(self, mock_get_db, client):
        # db is None here; the endpoint still answers, it just cannot clear.
        response = client.post(f"/ai-recommendations/{PATIENT_ID}", json={})

        assert response.status_code == 200
        assert response.json()["recommendations"] == []
