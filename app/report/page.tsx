"use client"

import { useState, useEffect } from "react"
import { Download, Eye, FileText, User } from "lucide-react"

interface PatientData {
  name: string
  age: number
  gender: string
  budget: number
}

interface Recommendation {
  type: string
  description: string
  cost: string
  duration: string
  suitability: number
}

export default function ReportPage() {
    const [isGenerating, setIsGenerating] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [patientData, setPatientData] = useState<PatientData | null>(null)
    const [patientId, setPatientId] = useState<string | null>(null)
    const [detectedConditions, setDetectedConditions] = useState<string[]>([])
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [annotatedImage, setAnnotatedImage] = useState<string | null>(null)
    const [recommendations, setRecommendations] = useState<Recommendation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Helper function to sanitize filename for Windows compatibility
    const sanitizeFilename = (name: string): string => {
        // Remove invalid characters for Windows filenames: < > : " / \ | ? *
        let sanitized = name.replace(/[<>:"/\\|?*]/g, '').trim()

        // Ensure we have a valid name, fallback to "Patient" if empty
        if (!sanitized || sanitized.length === 0) {
            sanitized = 'Patient'
        }

        // Limit length to prevent extremely long filenames
        if (sanitized.length > 50) {
            sanitized = sanitized.substring(0, 50).trim()
        }

        return sanitized
    }

  // Load data from APIs
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

          // Set patient ID
          setPatientId(patientId)

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
          } else {
            console.log("DEBUG: No detected conditions found in localStorage")
            setDetectedConditions([])
          }

          // Load uploaded and annotated images from localStorage
          const storedUploadedImage = localStorage.getItem("uploadedImage")
          if (storedUploadedImage) {
            setUploadedImage(storedUploadedImage)
          }

          const storedAnnotatedImage = localStorage.getItem("annotatedImage")
          if (storedAnnotatedImage) {
            setAnnotatedImage(storedAnnotatedImage)
          }

          // Fetch recommendations
          const recommendationsResponse = await fetch(`http://127.0.0.1:8004/recommendations/${patientId}`)
          if (recommendationsResponse.ok) {
            const recs = await recommendationsResponse.json()
            const formattedRecs = recs.map((r: any) => ({
              type: r.treatment_type,
              description: r.rationale,
              cost: r.cost_estimate,
              duration: r.duration,
              suitability: r.suitability_score,
            }))
            setRecommendations(formattedRecs)
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

  // Helper function to convert blob URL to base64 data URL
  const getBase64FromBlobUrl = async (blobUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(blobUrl)
      const blob = await response.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error("Error converting blob to base64:", error)
      return null
    }
  }

  // Download PDF via Flask backend
  const handleDownloadPDF = async () => {
    if (!patientData || !patientId) return
    setIsGenerating(true)
    try {
      console.log("DEBUG: Generating PDF for patient:", patientId)

      const response = await fetch(`http://localhost:5000/generate-report/${patientId}`, {
        method: "GET",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("PDF API error:", errorText)
        throw new Error(`Failed to generate PDF: ${errorText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      // Sanitize patient name for filename
      const safeName = sanitizeFilename(patientData.name)
      a.download = `DentalAI_Report_${safeName}.pdf`

      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("PDF download failed:", error)
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Treatment Report</h1>
        <p className="text-lg text-gray-600">
          View and download your comprehensive dental prosthetic recommendation report.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
          <span className="text-gray-600">Loading report data...</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating || !patientData}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </>
          )}
        </button>

        <button
          onClick={() => setShowPreview(!showPreview)}
          className="inline-flex items-center px-6 py-3 border border-gray-400 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 transition-colors"
        >
          <Eye className="h-5 w-5 mr-2" />
          {showPreview ? "Hide Preview" : "Preview Report"}
        </button>
      </div>

      {/* Report Preview */}
      {showPreview && (
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-700">DentalAI Prosthetic Report</h2>
              <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            <FileText className="h-10 w-10 text-blue-600" />
          </div>

          {/* Patient Info */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-3">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Patient Information
            </h3>
            {patientData ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><span className="font-medium">Name:</span> {patientData.name}</p>
                <p><span className="font-medium">Age:</span> {patientData.age} years</p>
                <p><span className="font-medium">Gender:</span> {patientData.gender}</p>
                <p><span className="font-medium">Budget:</span> LKR {Number(patientData.budget).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No patient data available.</p>
            )}
          </div>

          {/* X-Ray Analysis */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">X-ray Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedImage && (
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Original X-ray</h4>
                  <img
                    src={uploadedImage}
                    alt="Original X-ray"
                    className="max-w-full h-48 object-contain border rounded-lg mx-auto"
                  />
                </div>
              )}
              {annotatedImage && (
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">AI-Analyzed X-ray</h4>
                  <img
                    src={annotatedImage}
                    alt="AI-Analyzed X-ray"
                    className="max-w-full h-48 object-contain border rounded-lg mx-auto"
                  />
                </div>
              )}
              {!uploadedImage && !annotatedImage && (
                <div className="col-span-2 text-center">
                  <p className="text-sm text-gray-600">AI analysis completed during upload phase</p>
                  <div className="w-full h-48 flex items-center justify-center text-gray-400 border rounded-lg mt-2">
                    Analysis results displayed above
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detected Conditions */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Detected Conditions</h3>
            {detectedConditions.length > 0 ? (
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                {detectedConditions.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No abnormalities detected.</p>
            )}
          </div>

          {/* AI Recommendations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">AI Recommendations</h3>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((r, i) => (
                  <div key={i} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-base font-semibold text-blue-800">{r.type}</h4>
                      <span className="text-sm text-gray-600">{r.suitability}% suitability</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{r.description}</p>
                    <p className="text-xs text-gray-500">Cost: {r.cost} | Duration: {r.duration}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recommendations found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
