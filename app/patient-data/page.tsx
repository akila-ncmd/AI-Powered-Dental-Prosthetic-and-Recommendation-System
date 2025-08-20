"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Heart,
  Activity,
  Loader2,
} from "lucide-react"
import { useAIAnalysis } from "@/hooks/use-ai-analysis"
import { useToast } from "@/hooks/use-toast"
import type { PatientData } from "@/lib/ai-service"

interface FormData {
  // Personal Information
  firstName: string
  lastName: string
  age: string
  gender: string
  ethnicity: string

  // Medical Information
  medicalHistory: string
  currentMedications: string
  allergies: string
  smokingStatus: string

  // Dental History
  previousDentalWork: string
  oralHygiene: string

  // Financial & Preferences
  budget: string
  insuranceProvider: string
  treatmentPreferences: string
}

interface FormErrors {
  [key: string]: string
}

export default function PatientDataPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { generateRecommendations, isGeneratingRecommendations, recommendations, error } = useAIAnalysis()

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [xrayAnalysis, setXrayAnalysis] = useState(null)

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    ethnicity: "",
    medicalHistory: "",
    currentMedications: "",
    allergies: "",
    smokingStatus: "",
    previousDentalWork: "",
    oralHygiene: "",
    budget: "",
    insuranceProvider: "",
    treatmentPreferences: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Load X-ray analysis from session storage
  useEffect(() => {
    const storedAnalysis = sessionStorage.getItem("xrayAnalysis")
    if (storedAnalysis) {
      setXrayAnalysis(JSON.parse(storedAnalysis))
    } else {
      // Redirect to upload if no analysis found
      router.push("/upload")
    }
  }, [router])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {}

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
      if (!formData.age.trim()) {
        newErrors.age = "Age is required"
      } else if (isNaN(Number(formData.age)) || Number(formData.age) <= 0 || Number(formData.age) > 120) {
        newErrors.age = "Please enter a valid age (1-120)"
      }
      if (!formData.gender) newErrors.gender = "Gender is required"
    }

    if (step === 2) {
      if (!formData.medicalHistory.trim()) newErrors.medicalHistory = "Medical history is required"
      if (!formData.smokingStatus) newErrors.smokingStatus = "Smoking status is required"
    }

    if (step === 3) {
      if (!formData.previousDentalWork.trim())
        newErrors.previousDentalWork = "Previous dental work information is required"
      if (!formData.oralHygiene) newErrors.oralHygiene = "Oral hygiene rating is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !xrayAnalysis) return

    // Convert form data to PatientData format
    const patientData: PatientData = {
      demographics: {
        age: Number(formData.age),
        gender: formData.gender,
        ethnicity: formData.ethnicity || undefined,
      },
      medical: {
        conditions: formData.medicalHistory
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        medications: formData.currentMedications
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
        allergies: formData.allergies
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        smokingStatus: formData.smokingStatus as "never" | "former" | "current" | "occasional",
      },
      dental: {
        previousWork: formData.previousDentalWork,
        oralHygiene: formData.oralHygiene as "excellent" | "good" | "fair" | "poor",
      },
      preferences: {
        budget: formData.budget ? Number(formData.budget) : undefined,
        insurance: formData.insuranceProvider || undefined,
        treatmentPreferences: formData.treatmentPreferences || undefined,
      },
    }

    try {
      const result = await generateRecommendations(patientData)

      if (result) {
        setIsSubmitted(true)

        // Store patient data and recommendations for use in other pages
        sessionStorage.setItem("patientData", JSON.stringify(patientData))
        sessionStorage.setItem("recommendations", JSON.stringify(result))

        toast({
          title: "Analysis complete!",
          description: "AI recommendations have been generated successfully",
        })

        // Redirect to recommendations page after a short delay
        setTimeout(() => {
          router.push("/recommendations")
        }, 2000)
      }
    } catch (err) {
      toast({
        title: "Generation failed",
        description: error || "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      })
    }
  }

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Medical History", icon: Heart },
    { number: 3, title: "Dental History", icon: Activity },
    { number: 4, title: "Preferences", icon: DollarSign },
  ]

  if (isSubmitted) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">Patient Data Submitted Successfully!</h1>

            <p className="text-xl text-gray-600 mb-8">
              Your patient information has been securely processed. Our AI is now analyzing the data to generate
              personalized prosthetic recommendations.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-gray-800 mb-2">Processing Status:</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-gray-700">X-ray analysis completed</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-gray-700">Patient data processed</span>
                </div>
                <div className="flex items-center text-sm">
                  <Loader2 className="h-4 w-4 text-blue-500 mr-2 animate-spin" />
                  <span className="text-gray-700">Generating AI recommendations...</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500">Redirecting to recommendations in a few seconds...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <User className="h-4 w-4" />
            <span>Step 2 of 4: Patient Information</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Patient{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Information
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Provide comprehensive patient details to generate accurate and personalized prosthetic recommendations
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number

              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                            ? "bg-blue-600 text-white shadow-lg scale-110"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <span className={`text-sm mt-2 font-medium ${isActive ? "text-blue-600" : "text-gray-600"}`}>
                      {step.title}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 transition-all duration-300 ${
                        currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                        errors.firstName ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-500"
                      }`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                        errors.lastName ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-500"
                      }`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      min="1"
                      max="120"
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                        errors.age ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-500"
                      }`}
                      placeholder="Enter age"
                    />
                    {errors.age && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.age}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange("gender", e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                        errors.gender ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-500"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity (Optional)</label>
                  <input
                    type="text"
                    value={formData.ethnicity}
                    onChange={(e) => handleInputChange("ethnicity", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g., Caucasian, Asian, Hispanic, African American"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    This information helps our AI provide more accurate recommendations based on genetic factors
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Medical History */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Medical History</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medical History *</label>
                  <textarea
                    value={formData.medicalHistory}
                    onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 resize-none ${
                      errors.medicalHistory ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Include relevant medical conditions, chronic diseases, surgeries, etc."
                  />
                  {errors.medicalHistory && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.medicalHistory}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications (Optional)</label>
                  <textarea
                    value={formData.currentMedications}
                    onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    placeholder="List all current medications, dosages, and frequency"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergies (Optional)</label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => handleInputChange("allergies", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    placeholder="List any known allergies to materials, medications, or substances"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Smoking Status *</label>
                  <select
                    value={formData.smokingStatus}
                    onChange={(e) => handleInputChange("smokingStatus", e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      errors.smokingStatus ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-500"
                    }`}
                  >
                    <option value="">Select smoking status</option>
                    <option value="never">Never smoked</option>
                    <option value="former">Former smoker</option>
                    <option value="current">Current smoker</option>
                    <option value="occasional">Occasional smoker</option>
                  </select>
                  {errors.smokingStatus && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.smokingStatus}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Smoking status affects healing and prosthetic success rates
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Dental History */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Dental History</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Previous Dental Work *</label>
                  <textarea
                    value={formData.previousDentalWork}
                    onChange={(e) => handleInputChange("previousDentalWork", e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 resize-none ${
                      errors.previousDentalWork ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-500"
                    }`}
                    placeholder="Describe any previous dental treatments, prosthetics, implants, crowns, bridges, etc."
                  />
                  {errors.previousDentalWork && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.previousDentalWork}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Oral Hygiene Rating *</label>
                  <select
                    value={formData.oralHygiene}
                    onChange={(e) => handleInputChange("oralHygiene", e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      errors.oralHygiene ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-500"
                    }`}
                  >
                    <option value="">Select oral hygiene level</option>
                    <option value="excellent">Excellent - Brushes 2+ times daily, flosses regularly</option>
                    <option value="good">Good - Brushes daily, occasional flossing</option>
                    <option value="fair">Fair - Irregular brushing and flossing</option>
                    <option value="poor">Poor - Minimal oral care</option>
                  </select>
                  {errors.oralHygiene && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.oralHygiene}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Preferences & Budget */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Budget & Preferences</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="text"
                      value={formData.budget}
                      onChange={(e) => handleInputChange("budget", e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Enter maximum budget"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    This helps our AI recommend prosthetic options within your financial constraints
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Provider (Optional)</label>
                  <input
                    type="text"
                    value={formData.insuranceProvider}
                    onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Enter insurance provider name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treatment Preferences (Optional)
                  </label>
                  <textarea
                    value={formData.treatmentPreferences}
                    onChange={(e) => handleInputChange("treatmentPreferences", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    placeholder="Any specific preferences for treatment approach, materials, timeline, etc."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 mb-2">Data Privacy Notice</h3>
                      <p className="text-sm text-blue-700">
                        All patient information is encrypted and securely stored. Your data will only be used to
                        generate prosthetic recommendations and will not be shared with third parties without consent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
              {currentStep > 1 ? (
                <button
                  onClick={handlePrevious}
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Previous</span>
                </button>
              ) : (
                <Link
                  href="/upload"
                  className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Upload</span>
                </Link>
              )}

              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <span>Next Step</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isGeneratingRecommendations}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isGeneratingRecommendations ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Recommendations</span>
                      <CheckCircle className="h-5 w-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Progress Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">X-ray uploaded and analyzed</span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${
                    currentStep >= 1 ? "bg-blue-500" : "bg-gray-300"
                  }`}
                >
                  {isSubmitted ? (
                    <CheckCircle className="h-3 w-3 text-white" />
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className={currentStep >= 1 ? "text-gray-700" : "text-gray-400"}>
                  Patient data collection {isSubmitted && "(Complete)"}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3" />
                <span className="text-gray-400">AI recommendation generation</span>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3" />
                <span className="text-gray-400">Report generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
