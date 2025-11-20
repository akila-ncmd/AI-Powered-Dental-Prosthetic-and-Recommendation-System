import asyncio
from app.database import Database
from bson import ObjectId
from datetime import datetime

async def test_patient_creation():
    try:
        # Connect to database
        await Database.connect_to_mongo()
        db = Database.get_database()

        # Create test patient data
        patient_data = {
            "_id": ObjectId(),
            "name": "Test Patient",
            "nic": "123456789V",
            "age": 30,
            "gender": "Male",
            "budget": 100000,
            "medical_conditions": ["Diabetes"],
            "other_medical_condition": "",
            "allergies": "",
            "habits": ["Smoking"],
            "family_dental_history": "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        print("Inserting patient data...")
        result = await db.patients.insert_one(patient_data)
        patient_id = str(result.inserted_id)

        print(f"Patient created with id: {patient_id}")

        # Verify the patient was created
        patient = await db.patients.find_one({"_id": result.inserted_id})
        print(f"Patient retrieved: {patient}")

        # Test recommendation generation
        from app.recommendation_engine import recommendation_engine
        print("Generating recommendations...")
        recommendations = await recommendation_engine.generate_recommendations(
            patient_id, ["Caries"]
        )
        print(f"Generated {len(recommendations)} recommendations")

        return True

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_patient_creation())
    print(f"Test {'PASSED' if success else 'FAILED'}")