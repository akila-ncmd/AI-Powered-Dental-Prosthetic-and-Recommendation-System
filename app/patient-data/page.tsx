"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, AlertCircle, Shield, User, DollarSign, FileText } from "lucide-react"
import Link from "next/link"

type FormData = {
  firstName: string
  lastName: string
  age: string
  gender: string
  ethnicity: string
  medicalHistory: string
  allergies: string
  budget: string
  previousTreatments: string
}

type FormErrors = {
  [key in keyof FormData]?: string
}

export default function PatientDataPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    ethnicity: "",
    medicalHistory: "",
    allergies: "",
    budget: "",
    previousTreatments: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}

    // Step 1 validation
    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
      if (!formData.age.trim()) {
        newErrors.age = "Age is required"
      } else if (isNaN(Number(formData.age)) || Number(formData.age) <= 0 || Number(formData.age) > 120) {
        newErrors.age = "Please enter a valid age"
      }
      if (!formData.gender) newErrors.gender = "Gender is required"
    }

    // Step 2 validation
    if (currentStep === 2) {
      if (!formData.medicalHistory.trim()) newErrors.medicalHistory = "Medical history is required"
      if (formData.budget && isNaN(Number(formData.budget))) {
        newErrors.budget = "Budget must be a number"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateForm()) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/recommendations")
      }, 2000)
    }, 1500)
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Patient Information</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Provide patient details to help our AI generate personalized prosthetic recommendations
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                <User className="h-5 w-5" />
              </div>
              <span className="text-sm mt-2 text-gray-600">Personal Info</span>
            </div>

            <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"}`}></div>

            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-sm mt-2 text-gray-600">Medical History</span>
            </div>

            <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? "bg-blue-600" : "bg-gray-200"}`}></div>

            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                <DollarSign className="h-5 w-5" />
              </div>
              <span className="text-sm mt-2 text-gray-600">Budget & Preferences</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {isSubmitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Information Submitted Successfully!</h2>
                <p className="text-gray-600 mb-6">
                  Your patient data has been received. Redirecting to recommendations...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                  <div className="bg-green-600 h-2.5 rounded-full animate-pulse" style={{ width: "100%" }}></div>
                </div>
              </div>
            ) : (
              <div className="p-8">
                {currentStep === 1 && (
                  <>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">Personal Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                          First Name*
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.firstName ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.firstName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name*
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.lastName ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                          Age*
                        </label>
                        <input
                          type="number"
                          id="age"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          min="1"
                          max="120"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.age ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.age && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.age}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                          Gender*
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.gender ? "border-red-500" : "border-gray-300"
                          }`}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                        {errors.gender && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.gender}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="ethnicity" className="block text-sm font-medium text-gray-700 mb-1">
                        Ethnicity (Optional)
                      </label>
                      <input
                        type="text"
                        id="ethnicity"
                        name="ethnicity"
                        value={formData.ethnicity}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This information helps our AI provide more accurate recommendations based on genetic factors.
                      </p>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">Medical History</h2>

                    <div className="mb-6">
                      <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">
                        Medical History*
                      </label>
                      <textarea
                        id="medicalHistory"
                        name="medicalHistory"
                        value={formData.medicalHistory}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Include relevant medical conditions, medications, etc."
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.medicalHistory ? "border-red-500" : "border-gray-300"
                        }`}
                      ></textarea>
                      {errors.medicalHistory && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.medicalHistory}
                        </p>
                      )}
                    </div>

                    <div className="mb-6">
                      <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">
                        Allergies (Optional)
                      </label>
                      <textarea
                        id="allergies"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        rows={2}
                        placeholder="List any known allergies to materials or medications"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      ></textarea>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="previousTreatments" className="block text-sm font-medium text-gray-700 mb-1">
                        Previous Dental Treatments (Optional)
                      </label>
                      <textarea
                        id="previousTreatments"
                        name="previousTreatments"
                        value={formData.previousTreatments}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Describe any previous dental work or prosthetics"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      ></textarea>
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">Budget & Preferences</h2>

                    <div className="mb-6">
                      <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                        Budget Range (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="text"
                          id="budget"
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          placeholder="Enter maximum budget"
                          className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.budget ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.budget && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.budget}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        This helps our AI recommend prosthetic options within your financial constraints.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Data Privacy Notice</h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>
                              All patient information is encrypted and securely stored. Your data will only be used to
                              generate prosthetic recommendations and will not be shared with third parties.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-between mt-8">
                  {currentStep > 1 ? (
                    <button
                      onClick={handlePrevStep}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                  ) : (
                    <Link
                      href="/upload"
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back to Upload
                    </Link>
                  )}

                  {currentStep < 3 ? (
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-shadow flex items-center"
                    >
                      Next
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-shadow flex items-center disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Submit
                          <Check className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
