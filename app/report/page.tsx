"use client"

import { useState } from "react"
import Link from "next/link"
import {
  FileText,
  Download,
  Printer,
  Share2,
  User,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Brain,
  Award,
  Clock,
  DollarSign,
} from "lucide-react"

export default function ReportPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)

  const handleGenerateReport = () => {
    setIsGenerating(true)

    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false)
      setIsGenerated(true)
    }, 3000)
  }

  const handleDownloadPDF = () => {
    // Simulate PDF download
    alert("PDF report would be downloaded here. Integration with ReportLab pending.")
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = () => {
    // Simulate sharing functionality
    alert("Share functionality would be implemented here (email, secure link, etc.)")
  }

  const reportData = {
    patient: {
      name: "John Doe",
      age: 45,
      gender: "Male",
      id: "PT-2024-001",
      date: new Date().toLocaleDateString(),
      ethnicity: "Caucasian",
    },
    analysis: {
      missingTeeth: "Lower right first molar (#30)",
      boneDensity: "Excellent (D2 classification)",
      adjacentTeeth: "Healthy with good root structure",
      gumCondition: "Good with minimal inflammation",
      overallRisk: "Low",
    },
    recommendation: {
      primary: "Dental Implant",
      suitability: 92,
      cost: "$3,000 - $5,000",
      duration: "3-6 months",
      successRate: "95-98%",
    },
    alternatives: [
      { name: "Dental Bridge", suitability: 78, cost: "$2,000 - $4,000" },
      { name: "Partial Denture", suitability: 65, cost: "$1,200 - $2,500" },
    ],
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <FileText className="h-4 w-4" />
            <span>Step 4 of 4: Report Generation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Treatment{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Report</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive AI-generated prosthetic recommendation report ready for download and sharing
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Action Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Patient Report</h2>
                  <p className="text-gray-500">
                    {reportData.patient.name} • ID: {reportData.patient.id} • {reportData.patient.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {!isGenerated ? (
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        <span>Generate Report</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleDownloadPDF}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                    >
                      <Download className="h-5 w-5" />
                      <span>Download PDF</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2"
                    >
                      <Printer className="h-5 w-5" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={handleShare}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2"
                    >
                      <Share2 className="h-5 w-5" />
                      <span>Share</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {isGenerated ? (
              <>
                {/* Report Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">DentalAI Pro Report</h2>
                      <p className="text-blue-100">AI-Powered Prosthetic Recommendation System</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">Report #{reportData.patient.id}</div>
                      <div className="text-blue-100">Generated: {reportData.patient.date}</div>
                    </div>
                  </div>
                </div>

                {/* Report Body */}
                <div className="p-8 space-y-8">
                  {/* Patient Information */}
                  <section>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <User className="h-6 w-6 text-blue-600 mr-2" />
                      Patient Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <h4 className="font-semibold text-gray-800 mb-4">Demographics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Full Name:</span>
                            <span className="font-medium">{reportData.patient.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Age:</span>
                            <span className="font-medium">{reportData.patient.age} years</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gender:</span>
                            <span className="font-medium">{reportData.patient.gender}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ethnicity:</span>
                            <span className="font-medium">{reportData.patient.ethnicity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-6">
                        <h4 className="font-semibold text-gray-800 mb-4">Analysis Details</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Patient ID:</span>
                            <span className="font-medium">{reportData.patient.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Analysis Date:</span>
                            <span className="font-medium">{reportData.patient.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Report Type:</span>
                            <span className="font-medium">Prosthetic Recommendation</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">AI Version:</span>
                            <span className="font-medium">DentalAI Pro v2.1</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Medical History Summary */}
                  <section>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Medical History Summary</h3>

                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Positive Factors
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li>• No history of diabetes or autoimmune disorders</li>
                            <li>• Excellent oral hygiene habits</li>
                            <li>• Non-smoker status</li>
                            <li>• No known allergies to dental materials</li>
                            <li>• Previous successful dental procedures</li>
                            <li>• Good overall health status</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Considerations
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li>• Controlled hypertension (well-managed)</li>
                            <li>• History of teeth grinding (uses night guard)</li>
                            <li>• Occasional jaw tension</li>
                            <li>• Takes blood pressure medication</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* X-Ray Analysis Results */}
                  <section>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Brain className="h-6 w-6 text-blue-600 mr-2" />
                      AI X-Ray Analysis Results
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <h4 className="font-semibold text-gray-800 mb-4">Clinical Findings</h4>
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-800">Missing Teeth</div>
                              <div className="text-sm text-gray-600">{reportData.analysis.missingTeeth}</div>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-800">Bone Density</div>
                              <div className="text-sm text-gray-600">{reportData.analysis.boneDensity}</div>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-800">Adjacent Teeth</div>
                              <div className="text-sm text-gray-600">{reportData.analysis.adjacentTeeth}</div>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-800">Gum Condition</div>
                              <div className="text-sm text-gray-600">{reportData.analysis.gumCondition}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-6">
                        <h4 className="font-semibold text-gray-800 mb-4">AI Confidence Metrics</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600">Image Quality Assessment</span>
                              <span className="text-sm font-medium">96%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: "96%" }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600">Analysis Accuracy</span>
                              <span className="text-sm font-medium">94%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "94%" }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600">Recommendation Confidence</span>
                              <span className="text-sm font-medium">92%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{ width: "92%" }} />
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Overall Risk Assessment:</span>
                              <span className="text-sm font-medium text-green-600">
                                {reportData.analysis.overallRisk}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Primary Recommendation */}
                  <section>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Award className="h-6 w-6 text-blue-600 mr-2" />
                      Primary Recommendation
                    </h3>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-2xl font-bold text-gray-800">{reportData.recommendation.primary}</h4>
                          <p className="text-gray-600">Titanium implant with ceramic crown</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-600">
                            {reportData.recommendation.suitability}%
                          </div>
                          <div className="text-sm text-gray-600">Suitability Score</div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6 mb-6">
                        <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                          <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="font-semibold text-gray-800">{reportData.recommendation.cost}</div>
                          <div className="text-sm text-gray-600">Estimated Cost</div>
                        </div>

                        <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                          <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="font-semibold text-gray-800">{reportData.recommendation.duration}</div>
                          <div className="text-sm text-gray-600">Treatment Duration</div>
                        </div>

                        <div className="text-center bg-white rounded-xl p-4 shadow-sm">
                          <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="font-semibold text-gray-800">{reportData.recommendation.successRate}</div>
                          <div className="text-sm text-gray-600">Success Rate</div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-6">
                        <h5 className="font-semibold text-gray-800 mb-3">Clinical Rationale</h5>
                        <p className="text-gray-700 leading-relaxed">
                          Based on the comprehensive AI analysis of the patient's X-ray and clinical profile, a dental
                          implant represents the optimal long-term solution. The patient demonstrates excellent bone
                          density adequate for successful osseointegration, healthy adjacent teeth that do not require
                          preparation, and optimal age and health status for implant surgery. The treatment cost aligns
                          with the patient's stated budget range, and the long-term benefits significantly outweigh the
                          initial investment.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Alternative Options */}
                  <section>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Alternative Treatment Options</h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      {reportData.alternatives.map((alt, index) => (
                        <div key={index} className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xl font-bold text-gray-800">{alt.name}</h4>
                            <span className="text-2xl font-bold text-blue-600">{alt.suitability}%</span>
                          </div>
                          <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between">
                              <span>Estimated Cost:</span>
                              <span className="font-medium">{alt.cost}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Suitability Score:</span>
                              <span className="font-medium">{alt.suitability}%</span>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-gray-600">
                            {alt.name === "Dental Bridge"
                              ? "Fixed solution using adjacent teeth as anchors. Good option if patient prefers non-surgical approach."
                              : "Removable prosthetic option. Most economical but least recommended given patient's excellent oral health."}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Treatment Timeline */}
                  <section>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Recommended Treatment Timeline</h3>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            1
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">Initial Consultation (Week 1)</h4>
                            <p className="text-gray-600 text-sm">
                              Clinical examination, treatment planning, and patient education
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            2
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">Implant Placement (Week 2-3)</h4>
                            <p className="text-gray-600 text-sm">
                              Surgical placement of titanium implant with local anesthesia
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            3
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">Healing Period (Weeks 4-16)</h4>
                            <p className="text-gray-600 text-sm">
                              Osseointegration process with temporary restoration if needed
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            4
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">Crown Placement (Week 18-20)</h4>
                            <p className="text-gray-600 text-sm">
                              Final crown fabrication, fitting, and occlusal adjustment
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            5
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">Follow-up Care (Month 6+)</h4>
                            <p className="text-gray-600 text-sm">
                              Regular maintenance appointments and long-term monitoring
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Next Steps */}
                  <section>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Recommended Next Steps</h3>

                    <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-gray-800">Schedule consultation with a qualified prosthodontist</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-gray-800">Obtain detailed treatment plan and cost estimate</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-gray-800">Verify insurance coverage and financing options</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-gray-800">Schedule pre-operative appointments if proceeding</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Disclaimer */}
                  <section className="border-t border-gray-200 pt-8">
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Important Disclaimer</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        This AI-generated report is intended for informational purposes only and should not replace
                        professional dental consultation. The recommendations are based on X-ray analysis and
                        patient-provided information. Final treatment decisions should always be made in consultation
                        with a qualified dental professional who can perform a comprehensive clinical examination.
                        Individual results may vary, and success rates are based on general population statistics.
                      </p>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Report generated by DentalAI Pro v2.1 • {reportData.patient.date} • For questions about this
                          report, contact support@dentalai.pro
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            ) : (
              /* Report Generation Preview */
              <div className="p-12 text-center">
                <div className="max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <FileText className="h-12 w-12 text-blue-600" />
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Generate Your Report</h2>

                  <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Your comprehensive treatment report will include detailed AI analysis results, personalized
                    recommendations, treatment timelines, and cost estimates.
                  </p>

                  <div className="bg-blue-50 rounded-2xl p-6 mb-8 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Report Will Include:</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-left">
                      <div className="space-y-2">
                        <div className="flex items-center text-blue-800">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Patient information summary</span>
                        </div>
                        <div className="flex items-center text-blue-800">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Detailed X-ray analysis</span>
                        </div>
                        <div className="flex items-center text-blue-800">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">AI confidence metrics</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-blue-800">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Treatment recommendations</span>
                        </div>
                        <div className="flex items-center text-blue-800">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Cost estimates & timelines</span>
                        </div>
                        <div className="flex items-center text-blue-800">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Next steps guidance</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mb-8">Report generation typically takes 2-3 minutes</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center">
            <Link
              href="/recommendations"
              className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Recommendations</span>
            </Link>

            {isGenerated && (
              <Link
                href="/"
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <span>Start New Analysis</span>
                <CheckCircle className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
