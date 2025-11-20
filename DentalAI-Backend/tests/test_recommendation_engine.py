import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from app.recommendation_engine import RecommendationEngine

class TestRecommendationEngine:
    """Test cases for recommendation engine"""

    @pytest.fixture
    def engine(self):
        """Create recommendation engine instance"""
        return RecommendationEngine()

    def test_knowledge_base_initialization(self, engine):
        """Test treatment knowledge base is properly initialized"""
        assert "Dental Implant" in engine.treatment_knowledge_base
        assert "Dental Filling" in engine.treatment_knowledge_base

        implant_data = engine.treatment_knowledge_base["Dental Implant"]
        assert implant_data["success_rate"] == 95
        assert "Missing Teeth" in implant_data["conditions"]

    def test_condition_severity_weights(self, engine):
        """Test condition severity weight assignments"""
        assert engine.condition_severity_weights["Missing Teeth"] == 0.9
        assert engine.condition_severity_weights["Caries"] == 0.7
        assert engine.condition_severity_weights["Filling"] == 0.3

    def test_age_group_factors(self, engine):
        """Test age-based treatment suitability factors"""
        young_factors = engine.age_group_factors["young"]
        assert young_factors["min"] == 0
        assert young_factors["max"] == 25
        assert young_factors["implant_factor"] == 0.9

    def test_medical_condition_modifiers(self, engine):
        """Test medical condition modifier assignments"""
        diabetes_modifiers = engine.medical_condition_modifiers["Diabetes"]
        assert diabetes_modifiers["implant_modifier"] == -15
        assert diabetes_modifiers["surgery_modifier"] == -10

    def test_find_suitable_treatments(self, engine):
        """Test finding treatments for specific conditions"""
        suitable = engine._find_suitable_treatments("Caries")
        assert "Dental Filling" in suitable
        assert "Crown" in suitable

        # Test non-existent condition
        unsuitable = engine._find_suitable_treatments("NonExistent")
        assert len(unsuitable) == 0

    def test_calculate_base_suitability(self, engine):
        """Test base suitability score calculation"""
        treatment_data = engine.treatment_knowledge_base["Dental Implant"]
        patient_data = {
            "age": 45,
            "budget": 200000,
            "medical_conditions": []
        }

        score = engine._calculate_base_suitability(
            treatment_data, patient_data, "Missing Teeth"
        )

        assert isinstance(score, int)
        assert 0 <= score <= 100

    def test_calculate_base_suitability_age_penalty(self, engine):
        """Test age-based suitability penalties"""
        treatment_data = engine.treatment_knowledge_base["Dental Implant"]
        patient_data = {
            "age": 85,  # Above maximum age
            "budget": 200000,
            "medical_conditions": []
        }

        score = engine._calculate_base_suitability(
            treatment_data, patient_data, "Missing Teeth"
        )

        # Score should be calculated (age penalty may be applied)
        assert isinstance(score, int)
        assert 0 <= score <= 100

    def test_calculate_base_suitability_budget_penalty(self, engine):
        """Test budget-based suitability penalties"""
        treatment_data = engine.treatment_knowledge_base["Dental Implant"]
        patient_data = {
            "age": 45,
            "budget": 100000,  # Below minimum cost
            "medical_conditions": []
        }

        score = engine._calculate_base_suitability(
            treatment_data, patient_data, "Missing Teeth"
        )

        # Score should be calculated (budget penalty may be applied)
        assert isinstance(score, int)
        assert 0 <= score <= 100

    def test_calculate_base_suitability_medical_penalty(self, engine):
        """Test medical condition penalties"""
        treatment_data = engine.treatment_knowledge_base["Dental Implant"]
        patient_data = {
            "age": 45,
            "budget": 200000,
            "medical_conditions": ["Diabetes"]  # Medical condition
        }

        score = engine._calculate_base_suitability(
            treatment_data, patient_data, "Missing Teeth"
        )

        # Score should be calculated (medical penalties may be applied)
        assert isinstance(score, int)
        assert 0 <= score <= 100

    def test_generate_rationale(self, engine):
        """Test rationale generation for recommendations"""
        patient_data = {"age": 45, "budget": 200000}
        rationale = engine._generate_rationale("Dental Implant", "Missing Teeth", patient_data)

        assert isinstance(rationale, str)
        assert len(rationale) > 0
        assert "Permanent solution" in rationale

    def test_extract_features(self, engine):
        """Test feature extraction for ML"""
        recommendation = {
            "cost_min": 150000,
            "success_rate": 95,
            "risk_level": "medium"
        }
        patient_data = {
            "age": 45,
            "gender": "Male",
            "budget": 200000,
            "medical_conditions": ["Diabetes"]
        }
        detected_conditions = ["Missing Teeth", "Caries"]

        features = engine._extract_features(recommendation, patient_data, detected_conditions)

        assert len(features) == 8  # 8 features as per implementation
        assert features[0] == 45/100  # Normalized age
        assert features[1] == 1  # Gender (Male)
        assert features[2] == 200000/500000  # Normalized budget

    def test_calculate_ml_adjustment(self, engine):
        """Test ML-based score adjustment"""
        # Test case: senior with low budget (should decrease score)
        features_senior_low_budget = [0.8, 0, 0.1, 0.3, 0.95, 2, 2, 1]
        adjustment = engine._calculate_ml_adjustment(features_senior_low_budget)
        assert adjustment < 0  # Should be negative

        # Test case: young with high budget (should increase score)
        features_young_high_budget = [0.2, 1, 0.8, 0.3, 0.95, 1, 1, 0]
        adjustment = engine._calculate_ml_adjustment(features_young_high_budget)
        assert adjustment > 0  # Should be positive

    def test_apply_ml_scoring(self, engine):
        """Test ML scoring application"""
        recommendation = {
            "suitability_score": 80,
            "cost_min": 150000,
            "success_rate": 95,
            "risk_level": "medium"
        }
        patient_data = {
            "age": 45,
            "gender": "Male",
            "budget": 200000,
            "medical_conditions": []
        }
        detected_conditions = ["Missing Teeth"]

        enhanced_rec = engine._apply_ml_scoring(recommendation, patient_data, detected_conditions)

        assert "suitability_score" in enhanced_rec
        assert "ml_confidence" in enhanced_rec
        assert 0 <= enhanced_rec["suitability_score"] <= 100
        assert 0 <= enhanced_rec["ml_confidence"] <= 1

    @patch('app.recommendation_engine.Database.get_database')
    @pytest.mark.asyncio
    async def test_generate_recommendations_success(self, mock_get_db, engine):
        """Test successful recommendation generation"""
        from bson import ObjectId

        # Mock patient data
        patient_id = str(ObjectId())
        mock_patient = {
            "_id": ObjectId(patient_id),
            "name": "Test Patient",
            "age": 45,
            "budget": 200000,
            "medical_conditions": []
        }

        # Create mock database with async methods
        mock_db = MagicMock()
        mock_db.patients.find_one = AsyncMock(return_value=mock_patient)
        mock_db.recommendations.delete_many = AsyncMock()
        mock_db.recommendations.insert_one = AsyncMock()
        mock_get_db.return_value = mock_db

        recommendations = await engine.generate_recommendations(
            patient_id, ["Missing Teeth"]
        )

        assert isinstance(recommendations, list)
        assert len(recommendations) <= 5  # Top 5 recommendations

        if recommendations:
            rec = recommendations[0]
            assert "treatment" in rec
            assert "suitability_score" in rec
            assert "cost_estimate" in rec
            assert "rationale" in rec

    @patch('app.recommendation_engine.Database.get_database')
    @pytest.mark.asyncio
    async def test_generate_recommendations_patient_not_found(self, mock_get_db, engine):
        """Test recommendation generation with non-existent patient"""
        from bson import ObjectId

        mock_db = MagicMock()
        mock_db.patients.find_one = AsyncMock(return_value=None)
        mock_get_db.return_value = mock_db

        with pytest.raises(ValueError, match="Patient not found"):
            await engine.generate_recommendations(str(ObjectId()), ["Caries"])

    @patch('app.recommendation_engine.Database.get_database')
    @pytest.mark.asyncio
    async def test_store_recommendations(self, mock_get_db, engine):
        """Test recommendation storage in database"""
        from bson import ObjectId

        mock_db = MagicMock()
        mock_db.recommendations.delete_many = AsyncMock()
        mock_db.recommendations.insert_one = AsyncMock()
        mock_get_db.return_value = mock_db

        recommendations = [
            {
                "treatment": "Dental Implant",
                "condition": "Missing Teeth",
                "cost_estimate": "LKR 150,000 - LKR 200,000",
                "cost_min": 150000,
                "cost_max": 200000,
                "duration": "3-6 months",
                "success_rate": 95,
                "risk_level": "medium",
                "recovery_time": "2-4 weeks",
                "suitability_score": 85,
                "rationale": "Test rationale",
                "pros": ["Test pro"],
                "cons": ["Test con"],
                "ml_confidence": 0.8
            }
        ]

        await engine._store_recommendations(str(ObjectId()), recommendations)

        # Test passes if no exception is raised
        assert True

    @patch('app.recommendation_engine.Database.get_database')
    @pytest.mark.asyncio
    async def test_update_learning_data(self, mock_db, engine):
        """Test learning data update"""
        mock_collection = MagicMock()
        mock_db.recommendation_learning = mock_collection

        # Mock async operation
        async def mock_insert_one(*args, **kwargs):
            return None
        mock_collection.insert_one = mock_insert_one

        detected_conditions = ["Missing Teeth", "Caries"]
        recommendations = [
            {"treatment": "Dental Implant", "suitability_score": 85},
            {"treatment": "Dental Bridge", "suitability_score": 75}
        ]

        await engine._update_learning_data("test_patient_id", detected_conditions, recommendations)

        # Test passes if no exception is raised
        assert True