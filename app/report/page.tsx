"use client"

import { useState } from "react"
import {
  FileText,
  Download,
  Printer,
  Share2,
  User,
  DollarSign,
  Award,
  CheckCircle,
  AlertTriangle,
  Brain,
  Clock,
} from "lucide-react"

export default function ReportPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownloadPDF = () => {
    setIsGenerating(true)
    // Simulate PDF generation
    setTimeout(() => {
      setIsGenerating(false)
      alert("PDF report generated! (This would normally trigger a download)")
    }, 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    alert("Share functionality would be implemented here")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Treatment{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Report</span>
          </h1>
          <p className="text-xl text-gray-600">Comprehensive AI-generated prosthetic recommendation report</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Printer className="h-5 w-5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-semibold border border-gray-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Share2 className="h-5 w-5" />
            <span>Share Report</span>
          </button>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Report Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Dental Prosthetic Analysis Report</h2>
                <p className="text-blue-100">AI-Powered Recommendation System</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">Report #DR-2024-001</div>
                <div className="text-blue-100">Generated: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Patient Information */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <User className="h-6 w-6 text-blue-600 mr-2" />
                Patient Information
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">Demographics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">45 years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ethnicity:</span>
                      <span className="font-medium">Caucasian</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium">Female</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">Treatment Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget Range:</span>
                      <span className="font-medium">$3,000 - $5,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Analysis Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Urgency Level:</span>
                      <span className="font-medium text-yellow-600">Moderate</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Medical History Summary */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <FileText className="h-6 w-6 text-blue-600 mr-2" />
                Medical History Summary
              </h3>

              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Positive Factors
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• No history of diabetes or autoimmune disorders</li>
                      <li>• Good oral hygiene habits</li>
                      <li>• Non-smoker</li>
                      <li>• No known allergies to dental materials</li>
                      <li>• Previous successful dental procedures</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Considerations
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Mild osteoporosis (managed with supplements)</li>
                      <li>• History of teeth grinding (bruxism)</li>
                      <li>• Occasional jaw tension</li>
                      <li>• Takes blood pressure medication</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* X-Ray Analysis Results */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Brain className="h-6 w-6 text-blue-600 mr-2" />
                AI X-Ray Analysis Results
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">Findings</h4>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-gray-800">Missing Teeth</div>
                        <div className="text-sm text-gray-600">Teeth #14 and #15 (upper left premolars)</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-gray-800">Bone Density</div>
                        <div className="text-sm text-gray-600">Adequate for implant placement (Class II)</div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-gray-800">Adjacent Teeth</div>
                        <div className="text-sm text-gray-600">Healthy with good root structure</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">AI Confidence Metrics</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Image Quality</span>
                        <span className="text-sm font-medium">96%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "96%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Analysis Accuracy</span>
                        <span className="text-sm font-medium">94%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "94%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Recommendation Confidence</span>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Primary Recommendation */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Award className="h-6 w-6 text-blue-600 mr-2" />
                Primary Recommendation
              </h3>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800">Dental Implants</h4>
                    <p className="text-gray-600">Titanium implants with ceramic crowns</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-gray-600">Suitability Score</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-800">$3,000 - $5,000</div>
                    <div className="text-sm text-gray-600">Estimated Cost</div>
                  </div>

                  <div className="text-center">
                    <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-800">3-6 months</div>
                    <div className="text-sm text-gray-600">Treatment Duration</div>
                  </div>

                  <div className="text-center">
                    <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="font-semibold text-gray-800">95%+</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6">
                  <h5 className="font-semibold text-gray-800 mb-3">Why This Recommendation?</h5>
                  <p className="text-gray-700 leading-relaxed">
                    Based on the AI analysis of your X-ray and patient profile, dental implants offer the best long-term
                    solution. Your bone density is adequate for successful osseointegration, and your age and health
                    status are optimal for implant surgery. The investment aligns with your budget range and provides
                    the most natural feel and appearance.
                  </p>
                </div>
              </div>
            </section>

            {/* Alternative Options */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Alternative Treatment Options</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-gray-800">Partial Denture</h4>
                    <span className="text-2xl font-bold text-blue-600">85%</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <span className="font-medium">$1,200 - $2,500</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">2-4 weeks</span>
                    </div>
                    <p className="mt-3">Cost-effective removable option with good functionality.</p>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-gray-800">Dental Bridge</h4>
                    <span className="text-2xl font-bold text-purple-600">78%</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <span className="font-medium">$2,000 - $4,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">2-3 weeks</span>
                    </div>
                    <p className="mt-3">Fixed solution using adjacent teeth as anchors.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Recommended Next Steps</h3>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Schedule Consultation</h4>
                      <p className="text-gray-600 text-sm">
                        Meet with a prosthodontist to discuss the AI recommendations and treatment plan
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Additional Imaging</h4>
                      <p className="text-gray-600 text-sm">3D CBCT scan may be required for precise implant planning</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Treatment Planning</h4>
                      <p className="text-gray-600 text-sm">
                        Finalize treatment approach and timeline based on clinical examination
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Disclaimer */}
            <section className="border-t border-gray-200 pt-6">
              <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Important Disclaimer
                </h4>
                <p className="text-sm text-yellow-700">
                  This AI-generated report is for informational purposes only and should not replace professional dental
                  consultation. Final treatment decisions should always be made in consultation with a qualified dental
                  professional after thorough clinical examination and consideration of all relevant factors.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
