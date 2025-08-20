"use client"

import { useState } from "react"
import { Award, DollarSign, Clock, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function RecommendationsPage() {
  const [selectedRecommendation, setSelectedRecommendation] = useState(0)

  const recommendations = [
    {
      type: "Dental Implant",
      suitability: 92,
      cost: "$3,000 - $5,000",
      duration: "3-6 months",
      description: "Titanium implant with crown - most durable and natural-looking option",
      pros: ["Permanent solution", "Preserves bone structure", "Natural appearance"],
      cons: ["Higher initial cost", "Requires surgery", "Longer treatment time"],
    },
    {
      type: "Partial Denture",
      suitability: 85,
      cost: "$1,200 - $2,500",
      duration: "2-4 weeks",
      description: "Removable partial denture with metal framework",
      pros: ["Cost-effective", "Quick treatment", "Reversible"],
      cons: ["Less stable", "Requires maintenance", "May affect speech initially"],
    },
    {
      type: "Fixed Bridge",
      suitability: 78,
      cost: "$2,000 - $4,000",
      duration: "2-3 weeks",
      description: "Fixed bridge anchored to adjacent teeth",
      pros: ["Fixed solution", "Good aesthetics", "Relatively quick"],
      cons: ["Affects adjacent teeth", "Difficult to clean", "May need replacement"],
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">AI-Generated Recommendations</h1>
        <p className="text-lg text-gray-600">
          Based on X-ray analysis and patient data, here are your personalized prosthetic options
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* X-Ray Analysis Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">X-Ray Analysis</h3>
            <div className="relative">
              <img
                src="/placeholder.svg?height=300&width=300"
                alt="Analyzed X-ray"
                className="w-full rounded-lg border"
              />
              {/* Annotation Overlay */}
              <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
              <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-700">Missing teeth detected: 2</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-700">Bone density: Good</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-700">Adjacent teeth: Healthy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Panel */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
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
                    <h3 className="text-xl font-semibold text-gray-900">{rec.type}</h3>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold text-blue-600">{rec.suitability}%</div>
                      <div className="text-sm text-gray-500">Suitability</div>
                    </div>
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold ${
                        rec.suitability >= 90 ? "bg-green-500" : rec.suitability >= 80 ? "bg-blue-500" : "bg-yellow-500"
                      }`}
                    >
                      {rec.suitability}%
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{rec.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Cost Range</div>
                      <div className="text-sm text-gray-600">{rec.cost}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Treatment Time</div>
                      <div className="text-sm text-gray-600">{rec.duration}</div>
                    </div>
                  </div>
                </div>

                {selectedRecommendation === index && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Advantages</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {rec.pros.map((pro, i) => (
                            <li key={i} className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-700 mb-2">Considerations</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {rec.cons.map((con, i) => (
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
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              <FileText className="h-5 w-5 mr-2" />
              Save Recommendations
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
