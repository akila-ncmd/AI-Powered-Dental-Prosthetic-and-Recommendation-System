"use client"

import { useState } from "react"
import { User, Save, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function PatientDataPage() {
  const [formData, setFormData] = useState({
    name: "",
    nic: "",
    age: "",
    gender: "",
    budget: "10000",
    medicalConditions: [] as string[],
    otherMedicalCondition: "",
    allergies: "",
    habits: [] as string[],
    // pastDentalTreatments: [] as string[], // Removed as per requirements
    familyDentalHistory: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [detectedConditions, setDetectedConditions] = useState<string[]>([])

  // Fixed handleInputChange with proper type narrowing
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target
    const { name, value } = target

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      const checked = target.checked
      const fieldArray = formData[name as keyof typeof formData] as string[]
      if (checked) {
        setFormData({ ...formData, [name]: [...fieldArray, value] })
      } else {
        setFormData({ ...formData, [name]: fieldArray.filter((v) => v !== value) })
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Full Name is required"
    if (!formData.nic.trim()) newErrors.nic = "NIC is required"
    if (!formData.age || Number.parseInt(formData.age) < 1 || Number.parseInt(formData.age) > 120)
      newErrors.age = "Please enter a valid age (1-120)"
    if (!formData.gender) newErrors.gender = "Gender is required"
    if (!formData.budget || Number.parseInt(formData.budget) < 10000) newErrors.budget = "Select a valid budget"
    if (formData.medicalConditions.length === 0 && !formData.otherMedicalCondition.trim())
      newErrors.medicalConditions = "Select at least one medical condition or select 'None'"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setSubmitError(null)

    try {
      // Prepare patient data for API
      const patientData = {
        name: formData.name,
        nic: formData.nic,
        age: parseInt(formData.age),
        gender: formData.gender,
        budget: parseInt(formData.budget),
        medical_conditions: formData.medicalConditions.includes("None") ? [] : formData.medicalConditions.filter(cond => cond !== "None"),
        other_medical_condition: formData.otherMedicalCondition,
        allergies: formData.allergies,
        habits: formData.habits.filter(h => ["Smoking", "Alcohol", "Bruxism"].includes(h)),
        family_dental_history: formData.familyDentalHistory,
      }

      console.log("DEBUG: Sending patient data:", patientData)

      const response = await fetch("http://127.0.0.1:8004/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patientData),
      })

      console.log("DEBUG: Response status:", response.status)
      console.log("DEBUG: Response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("DEBUG: Error response text:", errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { detail: errorText }
        }
        throw new Error(errorData.detail || "Failed to save patient data")
      }

      const responseText = await response.text()
      console.log("DEBUG: Raw response text:", responseText)

      let savedPatient
      try {
        savedPatient = JSON.parse(responseText)
      } catch (e) {
        console.error("DEBUG: Failed to parse JSON response:", e)
        throw new Error("Invalid response from server")
      }

      console.log("DEBUG: Parsed API response:", savedPatient)
      setPatientId(savedPatient.id)

      // Store patient ID in localStorage for recommendations page
      console.log("DEBUG: Storing patient ID:", savedPatient.id)
      const patientId = savedPatient.id || savedPatient._id
      if (patientId) {
        localStorage.setItem("currentPatientId", patientId.toString())
        setPatientId(patientId)

        // Automatically generate AI recommendations if detected conditions exist
        if (detectedConditions.length > 0) {
          console.log("DEBUG: Generating AI recommendations automatically")
          try {
            const recommendationResponse = await fetch(`http://127.0.0.1:8004/ai-recommendations/${patientId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                detected_conditions: detectedConditions
              }),
            })

            if (recommendationResponse.ok) {
              console.log("DEBUG: AI recommendations generated successfully")
              alert("Patient data saved successfully! AI recommendations have been generated.")
            } else {
              console.warn("DEBUG: Failed to generate AI recommendations automatically")
              alert("Patient data saved successfully! You can view recommendations on the next page.")
            }
          } catch (recError) {
            console.warn("DEBUG: Error generating AI recommendations:", recError)
            alert("Patient data saved successfully! You can view recommendations on the next page.")
          }
        } else {
          alert("Patient data saved successfully!")
        }
      } else {
        console.error("DEBUG: No patient ID returned from API")
        console.error("DEBUG: Full response:", savedPatient)
        alert("Patient data saved successfully!")
      }
    } catch (error) {
      console.error("Error saving patient:", error)
      setSubmitError(error instanceof Error ? error.message : "Failed to save patient data")
    } finally {
      setIsLoading(false)
    }
  }

  // Load detected conditions from localStorage
  useEffect(() => {
    const storedConditions = localStorage.getItem("detectedConditions")
    if (storedConditions) {
      const conditions = JSON.parse(storedConditions)
      console.log("DEBUG: Loaded detected conditions in patient data page:", conditions)
      setDetectedConditions(conditions)
    }
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Patient Data Input</h1>
        <p className="text-lg text-gray-600">
          Enter patient information for personalized prosthetic recommendations
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Section: Patient Info */}
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter full name"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* NIC */}
          <div>
            <label htmlFor="nic" className="block text-sm font-medium text-gray-700 mb-2">
              NIC *
            </label>
            <input
              type="text"
              id="nic"
              name="nic"
              value={formData.nic}
              onChange={handleInputChange}
              placeholder="Enter National ID"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nic ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.nic && <p className="mt-1 text-sm text-red-600">{errors.nic}</p>}
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age *
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="1"
              max="120"
              placeholder="Enter patient age"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.age ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
              Gender *
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.gender ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Budget (LKR) *
            </label>
            <input
              type="range"
              id="budget"
              name="budget"
              min="10000"
              max="300000"
              step="5000"
              value={formData.budget}
              onChange={handleInputChange}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>LKR 10,000</span>
              <span>LKR 300,000</span>
            </div>
            <p className="mt-1 text-gray-700">Selected: LKR {formData.budget}</p>
            {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
          </div>
        </div>

        {/* Medical History */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Medical & Dental History *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              "Diabetes",
              "Hypertension",
              "Heart Disease",
              "Allergies",
              "Bone Loss",
              "Caries",
              "Crown",
              "Filling",
              "Implant",
              "Missing Teeth",
              "Root Canal Treatment",
              "Impacted Tooth",
            ].map((cond) => (
              <label key={cond} className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="medicalConditions"
                  value={cond}
                  checked={formData.medicalConditions.includes(cond)}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-gray-700">{cond}</span>
              </label>
            ))}

            {/* None */}
            <label className="inline-flex items-center space-x-2 col-span-full">
              <input
                type="checkbox"
                name="medicalConditions"
                value="None"
                checked={formData.medicalConditions.includes("None")}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-gray-700">None</span>
            </label>
            {formData.medicalConditions.includes("Other") && (
              <input
                type="text"
                name="otherMedicalCondition"
                value={formData.otherMedicalCondition}
                onChange={handleInputChange}
                placeholder="Specify other medical condition"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
          {errors.medicalConditions && <p className="mt-1 text-sm text-red-600">{errors.medicalConditions}</p>}
        </div>

        {/* Allergies */}
        <div className="mt-6">
          <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-2">
            Allergies
          </label>
          <textarea
            id="allergies"
            name="allergies"
            value={formData.allergies}
            onChange={handleInputChange}
            rows={3}
            placeholder="List any allergies (drugs, latex, etc.)"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Habits */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Habits</label>
          <div className="flex flex-wrap gap-3">
            {["Smoking", "Alcohol", "Bruxism", "Betel Chewing", "Coffee", "Tea"].map((habit) => (
              <label key={habit} className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="habits"
                  value={habit}
                  checked={formData.habits.includes(habit)}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-gray-700">{habit}</span>
              </label>
            ))}
          </div>
        </div>


        {/* Family Dental History */}
        <div className="mt-6">
          <label htmlFor="familyDentalHistory" className="block text-sm font-medium text-gray-700 mb-2">
            Family Dental History
          </label>
          <textarea
            id="familyDentalHistory"
            name="familyDentalHistory"
            value={formData.familyDentalHistory}
            onChange={handleInputChange}
            rows={3}
            placeholder="Any family dental issues (e.g., gum disease, tooth loss, etc.)"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>


        {/* Error Message */}
        {submitError && (
          <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-md">
            {submitError}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {isLoading ? "Saving..." : "Save Patient Data"}
          </button>

          <Link
            href="/recommendations"
            className="inline-flex items-center px-6 py-3 rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50 transition"
          >
            Next: View Recommendations
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>

      {/* AI Detected Conditions */}
      {detectedConditions.length > 0 && (
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-900 mb-3">AI-Detected Dental Conditions</h3>
          <p className="text-sm text-green-800 mb-3">
            Based on your uploaded X-ray analysis, the following conditions were detected:
          </p>
          <ul className="list-disc pl-5 text-sm text-green-800 space-y-1">
            {detectedConditions.map((condition, index) => (
              <li key={index}>{condition}</li>
            ))}
          </ul>
          <p className="text-xs text-green-700 mt-3">
            These conditions will be used to generate personalized treatment recommendations.
          </p>
        </div>
      )}

      {/* Privacy */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Data Privacy & Security</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• All patient data is encrypted and stored securely</li>
          <li>• Used solely for generating prosthetic recommendations</li>
          <li>• No third-party data sharing without consent</li>
          <li>• Compliant with HIPAA and healthcare data protection standards</li>
        </ul>
      </div>
    </div>
  )
}
