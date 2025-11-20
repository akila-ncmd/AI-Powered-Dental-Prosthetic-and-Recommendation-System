"""
AI-Powered Dental Prosthetic Recommendation Engine
Hybrid Rule-Based + Machine Learning System
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import numpy as np
from bson import ObjectId
from app.models import Patient, DetectedConditionType, TreatmentType
from app.database import Database

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Intelligent recommendation engine that combines rule-based logic
    with machine learning to generate personalized treatment recommendations
    """
    
    def __init__(self):
        self.treatment_knowledge_base = self._initialize_treatment_knowledge_base()
        self.condition_severity_weights = self._initialize_condition_weights()
        self.age_group_factors = self._initialize_age_factors()
        self.medical_condition_modifiers = self._initialize_medical_modifiers()
        
    def _initialize_treatment_knowledge_base(self) -> Dict[str, Dict[str, Any]]:
        """Initialize comprehensive treatment knowledge base"""
        return {
            "Dental Implant": {
                "conditions": ["Missing Teeth", "Bone Loss"],
                "cost_range": [120000, 250000],
                "duration": "3-6 months",
                "success_rate": 95,
                "age_suitability": {"min": 18, "max": 80, "optimal": [25, 65]},
                "contraindications": ["severe_bone_loss", "uncontrolled_diabetes"],
                "risk_level": "medium",
                "recovery_time": "2-4 weeks",
                "pros": [
                    "Permanent solution",
                    "Natural appearance and function",
                    "Preserves jawbone",
                    "High success rate"
                ],
                "cons": [
                    "Higher initial cost",
                    "Surgical procedure required",
                    "Longer treatment time",
                    "Not suitable for all patients"
                ]
            },
            "Dental Filling": {
                "conditions": ["Caries"],
                "cost_range": [3000, 8000],
                "duration": "1-2 hours",
                "success_rate": 90,
                "age_suitability": {"min": 3, "max": 100, "optimal": [10, 80]},
                "contraindications": ["extensive_decay"],
                "risk_level": "low",
                "recovery_time": "1-2 days",
                "pros": [
                    "Quick procedure",
                    "Cost-effective",
                    "Preserves natural tooth",
                    "Immediate results"
                ],
                "cons": [
                    "May need replacement over time",
                    "Not suitable for large cavities",
                    "Potential sensitivity"
                ]
            },
            "Crown": {
                "conditions": ["Caries", "Crown", "Root Canal Treatment"],
                "cost_range": [15000, 35000],
                "duration": "1-2 weeks",
                "success_rate": 92,
                "age_suitability": {"min": 16, "max": 85, "optimal": [20, 70]},
                "contraindications": ["insufficient_tooth_structure"],
                "risk_level": "low",
                "recovery_time": "3-7 days",
                "pros": [
                    "Restores full function",
                    "Natural appearance",
                    "Long-lasting solution",
                    "Protects weakened tooth"
                ],
                "cons": [
                    "Requires tooth preparation",
                    "Multiple visits needed",
                    "Moderate cost"
                ]
            },
            "Bone Graft": {
                "conditions": ["Bone Loss"],
                "cost_range": [25000, 80000],
                "duration": "2-4 weeks",
                "success_rate": 85,
                "age_suitability": {"min": 18, "max": 75, "optimal": [25, 60]},
                "contraindications": ["active_infection", "smoking_heavy"],
                "risk_level": "medium",
                "recovery_time": "4-6 weeks",
                "pros": [
                    "Restores bone structure",
                    "Enables future implants",
                    "Prevents further bone loss"
                ],
                "cons": [
                    "Surgical procedure",
                    "Longer healing time",
                    "Additional cost before implant"
                ]
            },
            "Partial Denture": {
                "conditions": ["Missing Teeth"],
                "cost_range": [25000, 60000],
                "duration": "2-4 weeks",
                "success_rate": 80,
                "age_suitability": {"min": 40, "max": 90, "optimal": [50, 80]},
                "contraindications": ["insufficient_support_teeth"],
                "risk_level": "low",
                "recovery_time": "1-2 weeks",
                "pros": [
                    "Removable option",
                    "Cost-effective",
                    "Quick solution",
                    "No surgery required"
                ],
                "cons": [
                    "May affect speech initially",
                    "Requires maintenance",
                    "Less stable than fixed options"
                ]
            },
            "Fixed Bridge": {
                "conditions": ["Missing Teeth"],
                "cost_range": [60000, 150000],
                "duration": "2-3 weeks",
                "success_rate": 88,
                "age_suitability": {"min": 20, "max": 75, "optimal": [30, 65]},
                "contraindications": ["weak_adjacent_teeth"],
                "risk_level": "medium",
                "recovery_time": "1-2 weeks",
                "pros": [
                    "Fixed solution",
                    "Natural function",
                    "Good aesthetics",
                    "No removal needed"
                ],
                "cons": [
                    "Requires healthy adjacent teeth",
                    "Higher cost than dentures",
                    "Difficult to clean under bridge"
                ]
            },
            "Root Canal Treatment": {
                "conditions": ["Periapical Lesion", "Root Canal Treatment"],
                "cost_range": [15000, 40000],
                "duration": "2-4 hours",
                "success_rate": 85,
                "age_suitability": {"min": 12, "max": 80, "optimal": [18, 70]},
                "contraindications": ["extensive_root_fracture"],
                "risk_level": "medium",
                "recovery_time": "3-7 days",
                "pros": [
                    "Saves natural tooth",
                    "Eliminates infection",
                    "Relieves pain"
                ],
                "cons": [
                    "Multiple visits may be needed",
                    "Tooth may become brittle",
                    "Crown often needed afterward"
                ]
            },
            "Extraction": {
                "conditions": ["Root Piece", "Impacted Tooth"],
                "cost_range": [5000, 12000],
                "duration": "30-60 min",
                "success_rate": 98,
                "age_suitability": {"min": 8, "max": 90, "optimal": [15, 75]},
                "contraindications": ["bleeding_disorders"],
                "risk_level": "low",
                "recovery_time": "3-7 days",
                "pros": [
                    "Quick procedure",
                    "Eliminates problem tooth",
                    "Cost-effective"
                ],
                "cons": [
                    "Permanent tooth loss",
                    "May need replacement",
                    "Potential complications"
                ]
            },
            "Surgical Extraction": {
                "conditions": ["Impacted Tooth"],
                "cost_range": [20000, 60000],
                "duration": "1-2 hours",
                "success_rate": 95,
                "age_suitability": {"min": 16, "max": 70, "optimal": [18, 50]},
                "contraindications": ["severe_medical_conditions"],
                "risk_level": "medium",
                "recovery_time": "1-2 weeks",
                "pros": [
                    "Removes problematic tooth",
                    "Prevents complications",
                    "High success rate"
                ],
                "cons": [
                    "Surgical procedure",
                    "Longer recovery",
                    "Higher cost than simple extraction"
                ]
            }
        }
    
    def _initialize_condition_weights(self) -> Dict[str, float]:
        """Initialize severity weights for different conditions"""
        return {
            "Missing Teeth": 0.9,
            "Bone Loss": 0.8,
            "Caries": 0.7,
            "Periapical Lesion": 0.8,
            "Impacted Tooth": 0.6,
            "Root Piece": 0.5,
            "Crown": 0.4,
            "Filling": 0.3,
            "Implant": 0.2,
            "Root Canal Treatment": 0.3
        }
    
    def _initialize_age_factors(self) -> Dict[str, Dict[str, float]]:
        """Initialize age-based treatment suitability factors"""
        return {
            "young": {"min": 0, "max": 25, "implant_factor": 0.9, "surgery_factor": 1.0},
            "adult": {"min": 26, "max": 60, "implant_factor": 1.0, "surgery_factor": 1.0},
            "senior": {"min": 61, "max": 100, "implant_factor": 0.8, "surgery_factor": 0.7}
        }
    
    def _initialize_medical_modifiers(self) -> Dict[str, Dict[str, float]]:
        """Initialize medical condition modifiers for treatment suitability"""
        return {
            "Diabetes": {
                "implant_modifier": -15,
                "surgery_modifier": -10,
                "healing_modifier": -5
            },
            "Hypertension": {
                "surgery_modifier": -8,
                "stress_modifier": -5
            },
            "Heart Disease": {
                "surgery_modifier": -12,
                "anticoagulant_modifier": -8
            },
            "Allergies": {
                "material_modifier": -5,
                "medication_modifier": -3
            }
        }
    
    async def generate_recommendations(
        self, 
        patient_id: str, 
        detected_conditions: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Generate personalized treatment recommendations using hybrid AI approach
        """
        try:
            # Fetch patient data
            db = Database.get_database()
            patient_data = await db.patients.find_one({"_id": ObjectId(patient_id)})
            
            if not patient_data:
                raise ValueError(f"Patient not found: {patient_id}")
            
            # Generate recommendations using hybrid approach
            recommendations = []
            
            # Rule-based recommendations
            rule_based_recs = self._generate_rule_based_recommendations(
                patient_data, detected_conditions
            )
            
            # ML-enhanced scoring
            for rec in rule_based_recs:
                enhanced_rec = self._apply_ml_scoring(rec, patient_data, detected_conditions)
                recommendations.append(enhanced_rec)
            
            # Sort by suitability score
            recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)
            
            # Store recommendations in database
            await self._store_recommendations(patient_id, recommendations)
            
            # Learn from this recommendation generation
            await self._update_learning_data(patient_id, detected_conditions, recommendations)
            
            return recommendations[:5]  # Return top 5 recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            raise
    
    def _generate_rule_based_recommendations(
        self, 
        patient_data: Dict[str, Any], 
        detected_conditions: List[str]
    ) -> List[Dict[str, Any]]:
        """Generate initial recommendations using rule-based logic"""
        recommendations = []
        
        for condition in detected_conditions:
            # Find suitable treatments for this condition
            suitable_treatments = self._find_suitable_treatments(condition)
            
            for treatment_name, treatment_data in suitable_treatments.items():
                # Calculate base suitability score
                base_score = self._calculate_base_suitability(
                    treatment_data, patient_data, condition
                )
                
                # Create recommendation object
                rec = {
                    "treatment": treatment_name,
                    "condition": condition,
                    "cost_estimate": f"LKR {treatment_data['cost_range'][0]:,} - LKR {treatment_data['cost_range'][1]:,}",
                    "cost_min": treatment_data['cost_range'][0],
                    "cost_max": treatment_data['cost_range'][1],
                    "duration": treatment_data['duration'],
                    "success_rate": treatment_data['success_rate'],
                    "risk_level": treatment_data['risk_level'],
                    "recovery_time": treatment_data['recovery_time'],
                    "suitability_score": base_score,
                    "rationale": self._generate_rationale(treatment_name, condition, patient_data),
                    "pros": treatment_data['pros'],
                    "cons": treatment_data['cons'],
                    "contraindications": treatment_data.get('contraindications', [])
                }
                
                recommendations.append(rec)
        
        return recommendations
    
    def _find_suitable_treatments(self, condition: str) -> Dict[str, Dict[str, Any]]:
        """Find treatments suitable for a given condition"""
        suitable = {}
        
        for treatment_name, treatment_data in self.treatment_knowledge_base.items():
            if condition in treatment_data['conditions']:
                suitable[treatment_name] = treatment_data
        
        return suitable
    
    def _calculate_base_suitability(
        self, 
        treatment_data: Dict[str, Any], 
        patient_data: Dict[str, Any], 
        condition: str
    ) -> int:
        """Calculate base suitability score using rule-based logic"""
        base_score = 80  # Starting score
        
        # Age factor
        age = patient_data.get('age', 30)
        age_suitability = treatment_data['age_suitability']
        
        if age < age_suitability['min'] or age > age_suitability['max']:
            base_score -= 20
        elif age_suitability['optimal'][0] <= age <= age_suitability['optimal'][1]:
            base_score += 10
        
        # Budget factor
        budget = patient_data.get('budget', 100000)
        avg_cost = (treatment_data['cost_range'][0] + treatment_data['cost_range'][1]) / 2
        
        if budget < treatment_data['cost_range'][0]:
            base_score -= 25
        elif budget >= treatment_data['cost_range'][1]:
            base_score += 15
        elif budget >= avg_cost:
            base_score += 5
        
        # Medical conditions factor
        medical_conditions = patient_data.get('medical_conditions', [])
        for med_condition in medical_conditions:
            if med_condition in self.medical_condition_modifiers:
                modifiers = self.medical_condition_modifiers[med_condition]
                
                if 'implant' in treatment_data['conditions'][0].lower():
                    base_score += modifiers.get('implant_modifier', 0)
                if treatment_data['risk_level'] in ['medium', 'high']:
                    base_score += modifiers.get('surgery_modifier', 0)
        
        # Success rate factor
        success_rate = treatment_data['success_rate']
        if success_rate >= 95:
            base_score += 10
        elif success_rate >= 90:
            base_score += 5
        elif success_rate < 80:
            base_score -= 10
        
        # Condition severity factor
        condition_weight = self.condition_severity_weights.get(condition, 0.5)
        base_score = int(base_score * (0.8 + condition_weight * 0.4))
        
        return max(0, min(100, base_score))
    
    def _apply_ml_scoring(
        self, 
        recommendation: Dict[str, Any], 
        patient_data: Dict[str, Any], 
        detected_conditions: List[str]
    ) -> Dict[str, Any]:
        """Apply machine learning enhancements to scoring"""
        
        # Feature extraction for ML model
        features = self._extract_features(recommendation, patient_data, detected_conditions)
        
        # Simple ML scoring (can be enhanced with actual ML models)
        ml_adjustment = self._calculate_ml_adjustment(features)
        
        # Apply ML adjustment
        original_score = recommendation['suitability_score']
        adjusted_score = max(0, min(100, original_score + ml_adjustment))
        
        recommendation['suitability_score'] = adjusted_score
        recommendation['ml_confidence'] = abs(ml_adjustment) / 20  # Normalize to 0-1
        
        return recommendation
    
    def _extract_features(
        self, 
        recommendation: Dict[str, Any], 
        patient_data: Dict[str, Any], 
        detected_conditions: List[str]
    ) -> np.ndarray:
        """Extract features for ML model"""
        features = []
        
        # Patient features
        features.append(patient_data.get('age', 30) / 100)  # Normalized age
        features.append(1 if patient_data.get('gender') == 'Male' else 0)  # Gender
        features.append(patient_data.get('budget', 100000) / 500000)  # Normalized budget
        
        # Treatment features
        features.append(recommendation['cost_min'] / 300000)  # Normalized cost
        features.append(recommendation['success_rate'] / 100)  # Success rate
        features.append(1 if recommendation['risk_level'] == 'low' else 
                      2 if recommendation['risk_level'] == 'medium' else 3)  # Risk level
        
        # Condition features
        features.append(len(detected_conditions))  # Number of conditions
        features.append(len(patient_data.get('medical_conditions', [])))  # Medical conditions count
        
        return np.array(features)
    
    def _calculate_ml_adjustment(self, features: np.ndarray) -> int:
        """Calculate ML-based adjustment to suitability score"""
        # Simple heuristic-based ML simulation
        # In production, this would use a trained ML model
        
        age_norm, gender, budget_norm, cost_norm, success_rate, risk_level, num_conditions, med_conditions = features
        
        adjustment = 0
        
        # Age-budget interaction
        if age_norm > 0.6 and budget_norm < 0.3:  # Senior with low budget
            adjustment -= 5
        elif age_norm < 0.3 and budget_norm > 0.7:  # Young with high budget
            adjustment += 5
        
        # Risk-medical condition interaction
        if med_conditions > 2 and risk_level > 2:  # Multiple conditions + high risk
            adjustment -= 8
        elif med_conditions == 0 and risk_level == 1:  # No conditions + low risk
            adjustment += 8
        
        # Success rate boost
        if success_rate > 0.9:
            adjustment += 3
        
        # Multiple conditions penalty
        if num_conditions > 3:
            adjustment -= 5
        
        return adjustment
    
    def _generate_rationale(
        self, 
        treatment: str, 
        condition: str, 
        patient_data: Dict[str, Any]
    ) -> str:
        """Generate explanation for why this treatment is recommended"""
        age = patient_data.get('age', 30)
        budget = patient_data.get('budget', 100000)
        
        rationale_parts = []
        
        # Treatment-specific rationale
        if treatment == "Dental Implant":
            rationale_parts.append("Permanent solution for missing teeth")
            if budget >= 150000:
                rationale_parts.append("within patient's budget range")
        elif treatment == "Dental Filling":
            rationale_parts.append("Cost-effective treatment for caries")
        elif treatment == "Crown":
            rationale_parts.append("Restores function and appearance")
        
        # Age-specific rationale
        if 25 <= age <= 65:
            rationale_parts.append("suitable for patient's age group")
        elif age > 65:
            rationale_parts.append("appropriate for senior patients")
        
        # Condition-specific rationale
        if condition == "Missing Teeth":
            rationale_parts.append("addresses tooth loss effectively")
        elif condition == "Caries":
            rationale_parts.append("prevents further decay progression")
        
        return ". ".join(rationale_parts).capitalize() + "."
    
    async def _store_recommendations(
        self, 
        patient_id: str, 
        recommendations: List[Dict[str, Any]]
    ) -> None:
        """Store generated recommendations in database"""
        try:
            db = Database.get_database()
            
            # Clear existing recommendations for this patient
            await db.recommendations.delete_many({"patient_id": patient_id})
            
            # Store new recommendations
            for rec in recommendations:
                rec_doc = {
                    "_id": ObjectId(),
                    "patient_id": patient_id,
                    "treatment_type": rec["treatment"],
                    "condition": rec["condition"],
                    "cost_estimate": rec["cost_estimate"],
                    "cost_min": rec["cost_min"],
                    "cost_max": rec["cost_max"],
                    "duration": rec["duration"],
                    "suitability_score": rec["suitability_score"],
                    "success_rate": rec["success_rate"],
                    "risk_level": rec["risk_level"],
                    "recovery_time": rec["recovery_time"],
                    "rationale": rec["rationale"],
                    "pros": rec["pros"],
                    "cons": rec["cons"],
                    "ml_confidence": rec.get("ml_confidence", 0.5),
                    "created_at": datetime.utcnow(),
                    "engine_version": "1.0"
                }
                
                await db.recommendations.insert_one(rec_doc)
                
        except Exception as e:
            logger.error(f"Error storing recommendations: {e}")
            raise
    
    async def _update_learning_data(
        self, 
        patient_id: str, 
        detected_conditions: List[str], 
        recommendations: List[Dict[str, Any]]
    ) -> None:
        """Update learning data for future improvements"""
        try:
            db = Database.get_database()
            
            learning_data = {
                "_id": ObjectId(),
                "patient_id": patient_id,
                "detected_conditions": detected_conditions,
                "num_recommendations": len(recommendations),
                "top_recommendation": recommendations[0]["treatment"] if recommendations else None,
                "avg_suitability": sum(r["suitability_score"] for r in recommendations) / len(recommendations) if recommendations else 0,
                "timestamp": datetime.utcnow()
            }
            
            await db.recommendation_learning.insert_one(learning_data)
            
        except Exception as e:
            logger.error(f"Error updating learning data: {e}")
            # Don't raise - this is non-critical
    
    async def initialize_treatment_knowledge_base_in_db(self) -> None:
        """Initialize treatment knowledge base in MongoDB"""
        try:
            db = Database.get_database()
            
            # Clear existing knowledge base
            await db.treatment_knowledge_base.delete_many({})
            
            # Insert treatment data
            for treatment_name, treatment_data in self.treatment_knowledge_base.items():
                doc = {
                    "_id": ObjectId(),
                    "treatment_name": treatment_name,
                    "conditions": treatment_data["conditions"],
                    "cost_range": treatment_data["cost_range"],
                    "duration": treatment_data["duration"],
                    "success_rate": treatment_data["success_rate"],
                    "age_suitability": treatment_data["age_suitability"],
                    "contraindications": treatment_data["contraindications"],
                    "risk_level": treatment_data["risk_level"],
                    "recovery_time": treatment_data["recovery_time"],
                    "pros": treatment_data["pros"],
                    "cons": treatment_data["cons"],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                await db.treatment_knowledge_base.insert_one(doc)
            
            logger.info("Treatment knowledge base initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing treatment knowledge base: {e}")
            raise

# Global instance
recommendation_engine = RecommendationEngine()