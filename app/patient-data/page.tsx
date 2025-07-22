"use client"

import type React from "react"

import { useState } from "react"
import { User, Save, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PatientDataPage() {
  const [formData, setFormData] = useState({
    age: "",
    ethnicity: "",
    medicalHistory: "",
    budget: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.age || Number.parseInt(formData.age) < 1 || Number.parseInt(formData.age) > 120) {
      newErrors.age = "Please enter a valid age (1-120)"
    }
    if (!formData.ethnicity.trim()) {
      newErrors.ethnicity = "Ethnicity is required"
    }
    if (!formData.medicalHistory.trim()) {
      newErrors.medicalHistory = "Medical history is required"
    }
    if (!formData.budget || Number.parseFloat(formData.budget) < 0) {
      newErrors.budget = "Please enter a valid budget amount"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      alert("Patient data saved successfully! Backend integration pending.")
      console.log("Form data:", formData)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Patient Data Input</h1>
        <p className="text-lg text-gray-600">Enter patient information for personalized prosthetic recommendations</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Age Input */}
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
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.age ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter patient age"
            />
            {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
          </div>

          {/* Ethnicity Input */}
          <div>
            <label htmlFor="ethnicity" className="block text-sm font-medium text-gray-700 mb-2">
              Ethnicity *
            </label>
            <input
              type="text"
              id="ethnicity"
              name="ethnicity"
              value={formData.ethnicity}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.ethnicity ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter patient ethnicity"
            />
            {errors.ethnicity && <p className="mt-1 text-sm text-red-600">{errors.ethnicity}</p>}
          </div>

          {/* Budget Input */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
              Budget (USD) *
            </label>
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              min="0"
              step="100"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.budget ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter budget amount"
            />
            {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
          </div>
        </div>

        {/* Medical History */}
        <div className="mt-6">
          <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
            Medical History *
          </label>
          <textarea
            id="medicalHistory"
            name="medicalHistory"
            value={formData.medicalHistory}
            onChange={handleInputChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.medicalHistory ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter relevant medical history, allergies, medications, and dental conditions..."
          />
          {errors.medicalHistory && <p className="mt-1 text-sm text-red-600">{errors.medicalHistory}</p>}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={handleSubmit}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Patient Data
          </button>

          <Link
            href="/recommendations"
            className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
          >
            Next: View Recommendations
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>

      {/* Information Panel */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Data Privacy & Security</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• All patient data is encrypted and stored securely</li>
          <li>• Information is used solely for generating prosthetic recommendations</li>
          <li>• Data is not shared with third parties without consent</li>
          <li>• Compliant with HIPAA and healthcare data protection standards</li>
        </ul>
      </div>
    </div>
  )
}
