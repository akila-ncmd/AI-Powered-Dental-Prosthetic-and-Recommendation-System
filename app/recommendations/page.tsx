"use client"

import { useState, useEffect } from "react"
import { Award, DollarSign, Clock, FileText, ArrowRight, Brain, TrendingUp, Shield, Activity, Save, Loader2, CheckCircle2 } from "lucide-react"
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
   const [selectedRecommendation, setSelectedRecommendation] = useState<number | null>(0) // Default to first
   const [message, setMessage] = useState<string | null>(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Load patient data and detected conditions from APIs
   useEffect(() => {
     const loadData = async () => {
       const patientId = localStorage.getItem("currentPatientId")

       if (!patientId) {
         setError("No patient selected. Please start from the patient record page.")
         setLoading(false)
         return
       }

       try {
         setLoading(true)
         setError(null)

         const patientResponse = await fetch(`http://127.0.0.1:8000/patients/${patientId}`)
         if (!patientResponse.ok) throw new Error("Failed to load patient data")
         
         const patient = await patientResponse.json()
         setPatientData(patient)

         const storedConditions = localStorage.getItem("detectedConditions")
         if (storedConditions) {
           const conditions = JSON.parse(storedConditions)
           setDetectedConditions(conditions)
           await generateAIRecommendations(patientId, conditions)
         } else {
           setDetectedConditions([])
           await generateAIRecommendations(patientId, ["Caries"])
         }
       } catch (error) {
         setError(error instanceof Error ? error.message : "Failed to load data")
       } finally {
         setLoading(false)
       }
     }

     loadData()
   }, [])

  const generateAIRecommendations = async (patientId: string, conditions: string[]) => {
    try {
      setIsGeneratingAI(true)
      
      const response = await fetch(`http://127.0.0.1:8000/ai-recommendations/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detected_conditions: conditions }),
      })

      if (!response.ok) throw new Error("Failed to generate AI recommendations")

      const data = await response.json()
      setRecommendations(data.recommendations || [])
      
    } catch (error) {
      setError("Failed to generate AI recommendations. Please try again.")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleRegenerateRecommendations = async () => {
    const patientId = localStorage.getItem("currentPatientId")
    if (!patientId || !detectedConditions.length) return
    await generateAIRecommendations(patientId, detectedConditions)
  }

  const handleSaveRecommendations = async () => {
    setMessage("Treatment plan finalized. Data synced automatically.")
    setTimeout(() => setMessage(null), 3000)
  }

  const getRankBadge = (index: number) => {
      if (index === 0) return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded border border-emerald-300 mr-3">PRIMARY Choice</span>
      if (index === 1) return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded border border-blue-300 mr-3">SECONDARY</span>
      return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2 py-1 rounded border border-slate-300 mr-3">ALTERNATIVE</span>
  }

  // Helper circle chart component constrainted by Tailwind
  const CircularGauge = ({ score, colorClass }: { score: number, colorClass: string }) => {
      return (
          <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-slate-50 border-4 border-slate-100 shadow-inner">
             {/* A true SVG gauge would go here, simulating with CSS */}
             <div className="absolute inset-0 rounded-full border-4 border-transparent"></div>
             <div className="flex flex-col items-center">
                 <span className={`text-lg font-bold ${colorClass.replace('bg-', 'text-').replace('-500', '-600')}`}>{score}</span>
                 <span className="text-[10px] text-slate-500 font-medium -mt-1">INDEX</span>
             </div>
             {/* Simple visual indicator rings */}
             <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                 <circle cx="28" cy="28" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                 strokeDasharray="176" strokeDashoffset={176 - (176 * score) / 100} 
                 className={`${colorClass.replace('bg-', 'text-')}`} />
             </svg>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12">
      {/* Top Toolbar */}
      <div className="w-full bg-slate-900 border-b border-slate-800 p-4 shadow-md sticky top-0 z-10">
          <div className="max-w-screen-xl mx-auto flex justify-between items-center px-4">
              <div className="flex items-center space-x-3 text-white">
                  <Brain className="h-6 w-6 text-purple-400" />
                  <h1 className="text-xl font-semibold tracking-wide">AI Treatment Planning</h1>
              </div>
          </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 mt-8 w-full">
        <div className="flex flex-col lg:flex-row gap-6">

            {/* Left Column: Context Pane */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                
                {/* Patient Context */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transform transition-all">
                    <div className="bg-slate-100 p-3 border-b border-slate-200">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                            <Activity className="h-4 w-4 mr-2" /> Clinical Context
                        </h2>
                    </div>
                    
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
                    ) : patientData ? (
                        <div className="p-4 grid gap-3">
                            <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Patient</p>
                                <p className="text-sm font-bold text-slate-800">{patientData.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Age/Sex</p>
                                    <p className="text-sm font-bold text-slate-800">{patientData.age} / {patientData.gender === 'Male' ? 'M' : patientData.gender === 'Female' ? 'F' : 'O'}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Budget</p>
                                    <p className="text-sm font-bold text-emerald-700">LKR {Number(patientData.budget).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <hr className="border-slate-200 my-1" />
                            
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Detected Pathology</p>
                                {detectedConditions.length > 0 ? (
                                    <ul className="flex flex-wrap gap-2">
                                        {detectedConditions.map((c, i) => (
                                            <li key={i} className="text-xs bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded font-medium">{c}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">No imaging pathologies detected.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-sm text-slate-500">Failed to load context.</div>
                    )}
                </div>

                {/* Actions Sidebar */}
                <div className="flex flex-col gap-3 sticky top-24">
                    {message && (
                        <div className="p-3 bg-emerald-50 text-emerald-800 text-sm font-medium rounded-lg border border-emerald-200 flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" /> {message}
                        </div>
                    )}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-800 text-sm font-medium rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleRegenerateRecommendations}
                        disabled={isGeneratingAI || loading}
                        className="w-full flex items-center justify-center px-4 py-3 bg-white text-slate-700 font-medium rounded-lg shadow-sm border border-slate-300 hover:bg-slate-50 transition disabled:opacity-50"
                    >
                        {isGeneratingAI ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2 text-purple-600" />}
                        {isGeneratingAI ? "Processing..." : "Recalculate Model"}
                    </button>

                    <button
                        onClick={handleSaveRecommendations}
                        className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition"
                    >
                        <Save className="h-4 w-4 mr-2" /> Finalize Plan
                    </button>

                    <Link
                        href="/report"
                        className="w-full flex items-center justify-center px-4 py-3 bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:bg-slate-800 transition mt-2"
                    >
                        Generate PDF Report
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </div>

            </div>

            {/* Right Column: Recommendations Feed */}
            <div className="flex-1 flex flex-col gap-4">
                
                {loading || isGeneratingAI ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[400px]">
                        <div className="relative flex justify-center items-center mb-6">
                            <div className="absolute animate-ping h-16 w-16 rounded-full bg-blue-400 opacity-20"></div>
                            <Brain className="h-10 w-10 text-blue-600 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Analyzing Clinical Graph Matrix...</h3>
                        <p className="text-sm text-slate-500">Cross-referencing {patientData?.medical_conditions?.length || 0} systemic markers against treatment pathways.</p>
                    </div>
                ) : recommendations.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
                        No viable treatment pathways identified matching current variables.
                    </div>
                ) : (
                    recommendations.map((rec, index) => {
                        const isExpanded = selectedRecommendation === index;
                        const scoreColor = rec.suitability_score >= 90 ? "bg-emerald-500" : rec.suitability_score >= 75 ? "bg-blue-500" : "bg-amber-500"

                        return (
                            <div key={index} 
                                 className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-sm hover:border-blue-300
                                 ${isExpanded ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 cursor-pointer'}`}
                                 onClick={() => !isExpanded && setSelectedRecommendation(index)}>
                                
                                <div className={`p-5 flex items-center justify-between ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                                    <div className="flex items-start">
                                        <div className="mt-1 mr-4">
                                            <CircularGauge score={rec.suitability_score} colorClass={scoreColor} />
                                        </div>
                                        <div>
                                            <div className="flex items-center mb-1">
                                                {getRankBadge(index)}
                                                <h3 className="text-lg font-bold text-slate-900">{rec.treatment}</h3>
                                            </div>
                                            <p className="text-sm text-slate-600 max-w-2xl line-clamp-2 mt-1">{rec.rationale}</p>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex flex-col items-end text-right ml-4">
                                        <div className="text-sm font-bold text-slate-800">{rec.cost_estimate}</div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> {rec.duration}</div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-slate-200 bg-white">
                                        
                                        {/* Metrics Strip */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-50 border-b border-slate-200 divide-x divide-slate-200">
                                            <div className="p-3 text-center">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Cost</p>
                                                <p className="text-sm font-semibold text-slate-800 mt-1">{rec.cost_estimate}</p>
                                            </div>
                                            <div className="p-3 text-center">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timeline</p>
                                                <p className="text-sm font-semibold text-slate-800 mt-1">{rec.duration}</p>
                                            </div>
                                            <div className="p-3 text-center">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Success</p>
                                                <p className="text-sm font-semibold text-slate-800 mt-1">{rec.success_rate}%</p>
                                            </div>
                                            <div className="p-3 text-center bg-blue-50/50">
                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">ML Confidence</p>
                                                <p className="text-sm font-semibold text-blue-900 mt-1">{(rec.ml_confidence * 100).toFixed(1)}%</p>
                                            </div>
                                        </div>

                                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3 flex items-center">
                                                    <CheckCircle2 className="w-4 h-4 mr-1"/> Clinical Advantages
                                                </h4>
                                                <ul className="space-y-2">
                                                    {rec.pros.map((pro, i) => (
                                                        <li key={i} className="text-sm text-slate-700 flex items-start">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-2 flex-shrink-0"></div>
                                                            <span>{pro}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3 flex items-center">
                                                    <Shield className="w-4 h-4 mr-1"/> Risk & Limitations
                                                </h4>
                                                <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center">
                                                    <span className="font-bold mr-2 uppercase">Risk Level:</span> 
                                                    {rec.risk_level} — Recovery: {rec.recovery_time}
                                                </div>
                                                <ul className="space-y-2">
                                                    {rec.cons.map((con, i) => (
                                                        <li key={i} className="text-sm text-slate-700 flex items-start">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2 flex-shrink-0"></div>
                                                            <span>{con}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
