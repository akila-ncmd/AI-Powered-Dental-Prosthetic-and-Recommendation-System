"use client"

import { useState } from "react"
import { Download, FileText, Printer, Share2, Calendar, User } from "lucide-react"

export default function ReportPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratePDF = () => {
    setIsGenerating(true)
    // Simulate PDF generation
    setTimeout(() => {
      setIsGenerating(false)
      alert("PDF report generated successfully! ReportLab integration pending.")
    }, 2000)
  }

  const reportData = {
    patientName: "John Doe",
    patientAge: 45,
    analysisDate: new Date().toLocaleDateString(),
    recommendedProsthetic: "Dental Implant",
    suitability: 92,
    estimatedCost: "$3,000 - $5,000",
    treatmentDuration: "3-6 months",
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Treatment Report</h1>
        <p className="text-lg text-gray-600">Comprehensive analysis and recommendations summary</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Report Header */}
            <div className="bg-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">DentalAI Pro Report</h2>
                  <p className="text-blue-100">AI-Powered Prosthetic Recommendation</p>
                </div>
                <FileText className="h-12 w-12 text-blue-200" />
              </div>
            </div>

            {/* Report Content */}
            <div className="p-6 space-y-6">
              {/* Patient Information */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{reportData.patientName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Age:</span>
                    <span className="ml-2 text-gray-600">{reportData.patientAge} years</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Analysis Date:</span>
                    <span className="ml-2 text-gray-600">{reportData.analysisDate}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Report ID:</span>
                    <span className="ml-2 text-gray-600">RPT-{Date.now().toString().slice(-6)}</span>
                  </div>
                </div>
              </div>

              {/* X-Ray Analysis */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">X-Ray Analysis Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <img
                      src="/placeholder.svg?height=200&width=300"
                      alt="X-ray analysis"
                      className="w-full rounded-lg border"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Missing teeth detected: 2</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Bone density: Good (85%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Adjacent teeth: Healthy</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Gum condition: Good</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Primary Recommendation</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xl font-semibold text-blue-900">{reportData.recommendedProsthetic}</h4>
                    <div className="text-2xl font-bold text-blue-600">{reportData.suitability}%</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Estimated Cost:</span>
                      <span className="ml-2 text-gray-600">{reportData.estimatedCost}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Treatment Duration:</span>
                      <span className="ml-2 text-gray-600">{reportData.treatmentDuration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternative Options */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Alternative Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Partial Denture</span>
                    <span className="text-blue-600 font-semibold">85% Suitability</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Fixed Bridge</span>
                    <span className="text-blue-600 font-semibold">78% Suitability</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Actions</h3>

            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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

            <button className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Printer className="h-5 w-5 mr-2" />
              Print Report
            </button>

            <button className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Share2 className="h-5 w-5 mr-2" />
              Share Report
            </button>

            <button className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Follow-up
            </button>
          </div>

          {/* Report Summary */}
          <div className="mt-6 bg-green-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-green-900 mb-3">Report Summary</h4>
            <ul className="text-sm text-green-800 space-y-2">
              <li>• AI analysis completed successfully</li>
              <li>• High confidence recommendation (92%)</li>
              <li>• Patient suitable for implant procedure</li>
              <li>• No contraindications detected</li>
              <li>• Follow-up consultation recommended</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
