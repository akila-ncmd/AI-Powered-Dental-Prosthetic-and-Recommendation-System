"use client"

import { useState, useEffect } from "react"
import { Award, DollarSign, Clock, FileText, ArrowRight, Brain, TrendingUp, Shield } from "lucide-react"
import Link from "next/link"

interface PatientData {
  name: string
  nic: string
  age: number
  gender: string
  budget: number
  medical_conditions: string[]
  other_medical_condition: string
  allergies: string
  habits: string[]
  family_dental_history: string
}

interface AIRecommendation {
  treatment: string
  cost_estimate: string
  duration: string
  suitability_score: number
  rationale: string
  success_rate: number
  risk_level: string
  recovery_time: string
  pros: string[]
  cons: string[]
  ml_confidence: number
}

export default function RecommendationsPage() {
   const [patientData, setPatientData] = useState<PatientData | null>(null)
   const [detectedConditions, setDetectedConditions] = useState<string[]>([])
   const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
   const [selectedRecommendation, setSelectedRecommendation] = useState<number | null>(null)
   const [message, setMessage] = useState<string | null>(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Load patient data and detected conditions from APIs
   useEffect(() => {
     const loadData = async () => {
       // Get patient ID from localStorage
       const patientId = localStorage.getItem("currentPatientId")

       if (!patientId) {
         setError("No patient selected. Please start from the patient data page.")
         setLoading(false)
         return
       }

       try {
         setLoading(true)
         setError(null)

         // Fetch patient data
         const patientResponse = await fetch(`http://127.0.0.1:8004/patients/${patientId}`)
         if (!patientResponse.ok) {
           throw new Error("Failed to load patient data")
         }
         const patient = await patientResponse.json()
         setPatientData(patient)

         // Load detected conditions from localStorage (set during upload)
         const storedConditions = localStorage.getItem("detectedConditions")
         if (storedConditions) {
           const conditions = JSON.parse(storedConditions)
           console.log("DEBUG: Loaded detected conditions from localStorage:", conditions)
           setDetectedConditions(conditions)
           
           // Automatically generate AI recommendations
           await generateAIRecommendations(patientId, conditions)
         } else {
           console.log("DEBUG: No detected conditions found in localStorage")
           setDetectedConditions([])
           // Generate recommendations with default condition
           await generateAIRecommendations(patientId, ["Caries"])
         }
       } catch (error) {
         console.error("Error loading data:", error)
         setError(error instanceof Error ? error.message : "Failed to load data")
       } finally {
         setLoading(false)
       }
     }

     loadData()
   }, [])

  // Generate AI-powered recommendations
  const generateAIRecommendations = async (patientId: string, conditions: string[]) => {
    try {
      setIsGeneratingAI(true)
      
      const response = await fetch(`http://127.0.0.1:8004/ai-recommendations/${patientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          detected_conditions: conditions
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate AI recommendations")
      }

      const data = await response.json()
      console.log("AI Recommendations generated:", data)
      
      setRecommendations(data.recommendations || [])
      setMessage("AI-powered recommendations generated successfully!")
      setTimeout(() => setMessage(null), 3000)
      
    } catch (error) {
      console.error("Error generating AI recommendations:", error)
      setError("Failed to generate AI recommendations. Please try again.")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Regenerate AI recommendations
  const handleRegenerateRecommendations = async () => {
    const patientId = localStorage.getItem("currentPatientId")
    if (!patientId || !detectedConditions.length) return

    await generateAIRecommendations(patientId, detectedConditions)
  }

  // Save recommendations to API (they're already saved by the AI engine)
  const handleSaveRecommendations = async () => {
    setMessage("Recommendations are automatically saved! You can now generate the report.")
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Brain className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Recommendations</h1>
        </div>
        <p className="text-lg text-gray-600">
          Advanced hybrid ML system analyzing X-ray data and patient profile for personalized treatment recommendations
        </p>
        {isGeneratingAI && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-600 font-medium">AI Engine Processing...</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
          <span className="text-gray-600">Loading recommendations...</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded">{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detected Conditions Panel */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected X-Ray Conditions</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                {detectedConditions.length > 0
                  ? detectedConditions.map((c, i) => <li key={i}>{c}</li>)
                  : <li>No X-ray analysis completed yet</li>}
              </ul>
              {patientData && (
                <div className="mt-4 text-sm text-gray-500">
                  Patient: <strong>{patientData.name}</strong> <br />
                  Age: {patientData.age} | Gender: {patientData.gender} <br />
                  Budget: LKR {Number(patientData.budget).toLocaleString()}
                </div>
              )}
            </>
          )}
        </div>

        {/* Recommendations Panel */}
        <div className="lg:col-span-2 space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all ${
                selectedRecommendation === index ? "ring-2 ring-blue-500 shadow-xl" : "hover:shadow-lg"
              }`}
              onClick={() => setSelectedRecommendation(index)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Award className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">{rec.treatment}</h3>
                  <div className="ml-3 flex items-center">
                    <Brain className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-xs text-purple-600 font-medium">
                      AI: {Math.round(rec.ml_confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold ${
                    rec.suitability_score >= 90 ? "bg-green-500" : rec.suitability_score >= 75 ? "bg-blue-500" : "bg-yellow-500"
                  }`}
                >
                  {rec.suitability_score}%
                </div>
              </div>

              <p className="text-gray-600 mb-4">{rec.rationale}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Cost Range</div>
                    <div className="text-sm text-gray-600">{rec.cost_estimate}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Treatment Time</div>
                    <div className="text-sm text-gray-600">{rec.duration}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Success Rate</div>
                    <div className="text-sm text-gray-600">{rec.success_rate}%</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Risk Level: </span>
                  <span className={`text-sm font-medium ${
                    rec.risk_level === 'low' ? 'text-green-600' :
                    rec.risk_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {rec.risk_level.charAt(0).toUpperCase() + rec.risk_level.slice(1)}
                  </span>
                  <span className="text-sm text-gray-600 ml-2">• Recovery: {rec.recovery_time}</span>
                </div>
              </div>

              {selectedRecommendation === index && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Advantages</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {rec.pros.map((pro: string, i: number) => (
                          <li key={i} className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">Disadvantages</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {rec.cons.map((con: string, i: number) => (
                          <li key={i} className="flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={handleRegenerateRecommendations}
              disabled={isGeneratingAI}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              <Brain className="h-5 w-5 mr-2" />
              {isGeneratingAI ? "Generating..." : "Regenerate AI Recommendations"}
            </button>

            <button
              onClick={handleSaveRecommendations}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-5 w-5 mr-2" />
              Confirm Recommendations
            </button>

            <Link
              href="/report"
              className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
            >
              Generate Report
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
