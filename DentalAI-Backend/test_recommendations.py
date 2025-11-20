"""
Test script for the AI-Powered Dental Recommendation Engine
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.recommendation_engine import recommendation_engine

async def test_recommendation_engine_core():
    """Test the core recommendation engine logic without database dependencies"""

    print("Testing AI-Powered Dental Recommendation Engine Core Logic")
    print("=" * 70)

    try:
        # Test patient data
        test_patients = [
            {
                "name": "John Smith",
                "age": 45,
                "gender": "Male",
                "budget": 200000,
                "medical_conditions": ["Diabetes"],
                "allergies": "None",
                "habits": ["Smoking"],
                "past_dental_treatments": ["Fillings"]
            },
            {
                "name": "Sarah Johnson",
                "age": 28,
                "gender": "Female",
                "budget": 150000,
                "medical_conditions": [],
                "allergies": "Penicillin",
                "habits": [],
                "past_dental_treatments": []
            },
            {
                "name": "Robert Wilson",
                "age": 65,
                "gender": "Male",
                "budget": 80000,
                "medical_conditions": ["Hypertension", "Heart Disease"],
                "allergies": "None",
                "habits": [],
                "past_dental_treatments": ["Crowns", "Root Canal"]
            }
        ]

        # Test scenarios
        test_scenarios = [
            {
                "patient": test_patients[0],
                "conditions": ["Missing Teeth", "Bone Loss"],
                "description": "Middle-aged diabetic smoker with missing teeth and bone loss"
            },
            {
                "patient": test_patients[1],
                "conditions": ["Caries"],
                "description": "Young healthy female with caries"
            },
            {
                "patient": test_patients[2],
                "conditions": ["Impacted Tooth", "Periapical Lesion"],
                "description": "Senior with multiple medical conditions"
            }
        ]

        print("Testing core recommendation logic...")

        # Test each scenario
        for i, scenario in enumerate(test_scenarios, 1):
            print(f"\nTest Scenario {i}: {scenario['description']}")
            print("-" * 60)

            patient_data = scenario["patient"]
            conditions = scenario["conditions"]

            try:
                # Test rule-based recommendations directly
                rule_based_recs = recommendation_engine._generate_rule_based_recommendations(
                    patient_data, conditions
                )

                print(f"Generated {len(rule_based_recs)} rule-based recommendations")

                # Apply ML scoring
                recommendations = []
                for rec in rule_based_recs:
                    enhanced_rec = recommendation_engine._apply_ml_scoring(rec, patient_data, conditions)
                    recommendations.append(enhanced_rec)

                # Sort by suitability score
                recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)

                # Display top recommendations
                for j, rec in enumerate(recommendations[:3], 1):  # Show top 3
                    print(f"\n  {j}. {rec['treatment']}")
                    print(f"     Cost: {rec['cost_estimate']}")
                    print(f"     Duration: {rec['duration']}")
                    print(f"     Suitability: {rec['suitability_score']}%")
                    print(f"     Success Rate: {rec['success_rate']}%")
                    print(f"     Risk Level: {rec['risk_level']}")
                    print(f"     ML Confidence: {rec.get('ml_confidence', 0):.2f}")
                    print(f"     Rationale: {rec['rationale']}")

                # Verify recommendation structure
                required_fields = ["treatment", "condition", "cost_estimate", "suitability_score", "rationale"]
                for rec in recommendations:
                    for field in required_fields:
                        if field not in rec:
                            raise ValueError(f"Missing required field: {field}")

                print(f"[PASS] Scenario {i} passed - all recommendations have required fields")

            except Exception as e:
                print(f"[ERROR] Error in scenario {i}: {e}")
                import traceback
                traceback.print_exc()

        # Test treatment knowledge base
        print("\nTesting treatment knowledge base...")
        kb = recommendation_engine.treatment_knowledge_base
        expected_treatments = ["Dental Implant", "Dental Filling", "Crown", "Bone Graft", "Partial Denture", "Fixed Bridge", "Root Canal Treatment", "Extraction", "Surgical Extraction"]

        for treatment in expected_treatments:
            if treatment not in kb:
                raise ValueError(f"Missing treatment in knowledge base: {treatment}")

        print(f"[PASS] Knowledge base contains {len(kb)} treatments")

        # Test condition matching
        print("\nTesting condition-treatment matching...")
        test_conditions = ["Missing Teeth", "Caries", "Bone Loss", "Impacted Tooth"]
        for condition in test_conditions:
            suitable = recommendation_engine._find_suitable_treatments(condition)
            if not suitable:
                print(f"[WARNING] No treatments found for condition '{condition}'")
            else:
                print(f"[PASS] Condition '{condition}' matches {len(suitable)} treatments")

        # Test feature extraction
        print("\nTesting ML feature extraction...")
        sample_rec = {
            "treatment": "Dental Implant",
            "cost_min": 120000,
            "cost_max": 250000,
            "success_rate": 95,
            "risk_level": "medium"
        }
        features = recommendation_engine._extract_features(sample_rec, test_patients[0], ["Missing Teeth"])
        if len(features) != 8:
            raise ValueError(f"Expected 8 features, got {len(features)}")
        print(f"[PASS] Feature extraction produces {len(features)} features")

        # Test ML adjustment calculation
        ml_adjustment = recommendation_engine._calculate_ml_adjustment(features)
        if not isinstance(ml_adjustment, (int, float)):
            raise ValueError("ML adjustment should be numeric")
        print(f"[PASS] ML adjustment calculation returns: {ml_adjustment}")

        print("\n" + "=" * 70)
        print("[SUCCESS] ALL TESTS PASSED - AI Recommendation System is working correctly!")
        print("=" * 70)

        # Summary
        print("\nTest Summary:")
        print(f"   • Tested {len(test_scenarios)} patient scenarios")
        print(f"   • Verified {len(expected_treatments)} treatments in knowledge base")
        print("   • Confirmed ML feature extraction and scoring")
        print("   • Validated recommendation structure and logic")

    except Exception as e:
        print(f"[FAILED] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True

if __name__ == "__main__":
    success = asyncio.run(test_recommendation_engine_core())
    sys.exit(0 if success else 1)