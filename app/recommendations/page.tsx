"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Brain,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  TrendingUp,
  Info,
  FileText,
  Download,
  Zap,
} from "lucide-react"

interface Recommendation {
  id: string
  name: string
  suitability: number
  cost: string
  duration: string
  successRate: string
  description: string
  pros: string[]
  cons: string[]
  gradient: string
  icon: string
}

export default function RecommendationsPage() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<string>("implant")
  const [showComparison, setShowComparison] = useState(false)

  const recommendations: Recommendation[] = [
    {
      id: "implant",
      name: "Dental Implant",
      suitability: 92,
      cost: "$3,000 - $5,000",
      duration: "3-6 months",
      successRate: "95-98%",
      description:
        "A titanium post surgically placed into the jawbone with a ceramic crown. Based on your X-ray analysis, you have excellent bone density and healthy adjacent teeth, making you an ideal candidate for implant therapy.",
      pros: [
        "Most natural look and feel",
        "Preserves jawbone structure",
        "Permanent solution (20+ years)",
        "No impact on adjacent teeth",
        "Easy maintenance like natural teeth",
      ],
      cons: [
        "Higher upfront investment",
        "Requires minor surgical procedure",
        "Healing period of 3-6 months",
        "May require bone grafting in some cases",
      ],
      gradient: "from-green-500 to-emerald-500",
      icon: "🦷",
    },
    {
      id: "bridge",
      name: "Dental Bridge",
      suitability: 78,
      cost: "$2,000 - $4,000",
      duration: "2-3 weeks",
      successRate: "85-90%",
      description:
        "A fixed prosthetic device that bridges the gap using adjacent teeth as anchors. Your adjacent teeth are healthy and strong enough to support a bridge effectively.",
      pros: [
        "Fixed, non-removable solution",
        "Faster treatment completion",
        "No surgical procedure required",
        "Immediate restoration of function",
        "Good aesthetic results",
      ],
      cons: [
        "Requires preparation of healthy adjacent teeth",
        "May need replacement after 10-15 years",
        "Difficult to clean underneath",
        "Potential for decay in anchor teeth",
      ],
      gradient: "from-blue-500 to-cyan-500",
      icon: "🌉",
    },
    {
      id: "denture",
      name: "Partial Denture",
      suitability: 65,
      cost: "$1,200 - $2,500",
      duration: "3-4 weeks",
      successRate: "75-85%",
      description:
        "A removable prosthetic replacement for missing teeth. While functional, this option is less ideal given your excellent oral health and single missing tooth.",
      pros: [
        "Most affordable option",
        "Non-invasive treatment",
        "Easy to repair if damaged",
        "Can be adjusted as needed",
        "Reversible treatment option",
      ],
      cons: [
        "Less stable than fixed options",
        "May affect speech initially",
        "Requires daily removal for cleaning",
        "Can cause gum irritation",
        "May feel bulky or unnatural",
      ],
      gradient: "from-purple-500 to-pink-500",
      icon: "🦷",
    },
  ]

  const selectedRec = recommendations.find((rec) => rec.id === selectedRecommendation) || recommendations[0]

  const analysisData = {
    missingTeeth: 1,
    location: "Lower right first molar (#30)",
    boneDensity: "Excellent (D2 classification)",
    adjacentTeeth: "Healthy with good root structure",
    gumHealth: "Good with minimal inflammation",
    overallRisk: "Low",
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Brain className="h-4 w-4" />
            <span>Step 3 of 4: AI Analysis Complete</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            AI-Generated{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Recommendations
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Based on comprehensive X-ray analysis and patient data, our AI has generated personalized prosthetic
            recommendations with confidence scores
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* X-Ray Analysis Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Brain className="h-6 w-6 text-blue-600 mr-2" />
                X-Ray Analysis
              </h2>

              {/* X-Ray Image with Annotations */}
              <div className="relative mb-6">
                <img
                  src="/placeholder.svg?height=300&width=300"
                  alt="Analyzed X-ray"
                  className="w-full rounded-xl border border-gray-200 shadow-md"
                />

                {/* AI Annotations */}
                <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                  AI Analyzed
                </div>

                {/* Missing tooth indicator */}
                <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                <div className="absolute top-1/2 left-1/3 transform translate-x-6 -translate-y-8 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Missing #30
                </div>

                {/* Healthy bone indicator */}
                <div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                <div className="absolute bottom-1/3 right-1/3 transform -translate-x-16 -translate-y-8 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Good Bone
                </div>
              </div>

              {/* Analysis Results */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Analysis Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Missing Teeth:</span>
                      <span className="font-medium">{analysisData.missingTeeth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium text-xs">{analysisData.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bone Density:</span>
                      <span className="font-medium text-green-600">{analysisData.boneDensity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Adjacent Teeth:</span>
                      <span className="font-medium text-green-600">Healthy</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Treatment Risk:</span>
                      <span className="font-medium text-green-600">{analysisData.overallRisk}</span>
                    </div>
                  </div>
                </div>

                {/* AI Confidence */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    AI Confidence Metrics
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-700">Image Quality</span>
                        <span className="font-medium">96%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "96%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-700">Analysis Accuracy</span>
                        <span className="font-medium">94%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "94%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-700">Recommendation Confidence</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "92%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Patient Profile</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Age: 45 (Optimal for implants)</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Non-smoker</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Good oral hygiene</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span>Budget: $3,500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recommendation Cards */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Treatment Options</h2>
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>{showComparison ? "Hide" : "Show"} Comparison</span>
                </button>
              </div>

              {/* Recommendation Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {recommendations.map((rec, index) => (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedRecommendation(rec.id)}
                    className={`p-6 rounded-2xl transition-all duration-300 text-left ${
                      selectedRecommendation === rec.id
                        ? `bg-gradient-to-br ${rec.gradient} text-white shadow-xl scale-105`
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl">{rec.icon}</div>
                      <div
                        className={`text-2xl font-bold ${
                          selectedRecommendation === rec.id ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {rec.suitability}%
                      </div>
                    </div>

                    <h3
                      className={`font-bold text-lg mb-2 ${
                        selectedRecommendation === rec.id ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {rec.name}
                    </h3>

                    <div className={`text-sm ${selectedRecommendation === rec.id ? "text-white/90" : "text-gray-600"}`}>
                      <div className="flex items-center mb-1">
                        <DollarSign className="h-3 w-3 mr-1" />
                        <span>{rec.cost}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{rec.duration}</span>
                      </div>
                    </div>

                    {selectedRecommendation === rec.id && index === 0 && (
                      <div className="mt-3 bg-white/20 rounded-lg px-3 py-1">
                        <span className="text-xs font-medium text-white">RECOMMENDED</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Detailed Recommendation */}
              <div className={`bg-gradient-to-br ${selectedRec.gradient} rounded-2xl p-8 text-white mb-8`}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{selectedRec.name}</h3>
                    <p className="text-white/90 leading-relaxed">{selectedRec.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold mb-1">{selectedRec.suitability}%</div>
                    <div className="text-white/80 text-sm">Suitability</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/20 rounded-xl p-4 text-center">
                    <DollarSign className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-semibold">{selectedRec.cost}</div>
                    <div className="text-white/80 text-sm">Estimated Cost</div>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-semibold">{selectedRec.duration}</div>
                    <div className="text-white/80 text-sm">Treatment Time</div>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 text-center">
                    <Award className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-semibold">{selectedRec.successRate}</div>
                    <div className="text-white/80 text-sm">Success Rate</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/10 rounded-xl p-4">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Advantages
                    </h4>
                    <ul className="space-y-2">
                      {selectedRec.pros.map((pro, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 mr-2 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white/10 rounded-xl p-4">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Considerations
                    </h4>
                    <ul className="space-y-2">
                      {selectedRec.cons.map((con, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 mr-2 flex-shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Comparison Table */}
              {showComparison && (
                <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Treatment Comparison</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-800">Treatment</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-800">Suitability</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-800">Cost</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-800">Duration</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-800">Success Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendations.map((rec) => (
                          <tr key={rec.id} className="border-b border-gray-100">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <span className="text-xl">{rec.icon}</span>
                                <span className="font-medium text-gray-800">{rec.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-4 px-4">
                              <div
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  rec.suitability >= 90
                                    ? "bg-green-100 text-green-800"
                                    : rec.suitability >= 75
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {rec.suitability}%
                              </div>
                            </td>
                            <td className="text-center py-4 px-4 text-gray-600">{rec.cost}</td>
                            <td className="text-center py-4 px-4 text-gray-600">{rec.duration}</td>
                            <td className="text-center py-4 px-4 text-gray-600">{rec.successRate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Clinical Notes */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Clinical Recommendation</h3>
                    <p className="text-blue-800 leading-relaxed">
                      Based on the comprehensive analysis of your X-ray and patient profile, the{" "}
                      <strong>dental implant</strong> is the optimal long-term solution. Your excellent bone density,
                      healthy adjacent teeth, and good oral hygiene make you an ideal candidate. The investment aligns
                      with your budget and provides the most natural, long-lasting result.
                    </p>
                    <p className="text-blue-800 mt-3">
                      <strong>Next Step:</strong> Schedule a consultation with a prosthodontist to discuss the treatment
                      plan and timeline in detail.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Next Steps</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <Link
                  href="/report"
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-4"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">Generate Detailed Report</h4>
                    <p className="text-white/80 text-sm">Create a comprehensive PDF report with all recommendations</p>
                  </div>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button className="group bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Download className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-lg mb-1">Save Recommendations</h4>
                    <p className="text-gray-500 text-sm">Download recommendations for your records</p>
                  </div>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/patient-data"
                    className="flex-1 text-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                  >
                    Back to Patient Data
                  </Link>

                  <button className="flex-1 text-center px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    Schedule Consultation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
