"use client"

import { useState, useEffect } from "react"
import { User, Save, ArrowRight, Loader2, FileText, ClipboardList, Shield, AlertTriangle, CheckCircle, Activity, ScanLine } from "lucide-react"
import Link from "next/link"

export default function PatientDataPage() {
  const [formData, setFormData] = useState({
    name: "",
    nic: "",
    age: "",
    gender: "",
    budget: "10000",
    medicalConditions: [] as string[],
    otherMedicalCondition: "",
    allergies: "",
    habits: [] as string[],
    familyDentalHistory: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [detectedConditions, setDetectedConditions] = useState<string[]>([])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target
    const { name, value } = target

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      const checked = target.checked
      const fieldArray = formData[name as keyof typeof formData] as string[]
      if (checked) {
        setFormData({ ...formData, [name]: [...fieldArray, value] })
      } else {
        setFormData({ ...formData, [name]: fieldArray.filter((v) => v !== value) })
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Full Name is required"
    if (!formData.nic.trim()) newErrors.nic = "Patient ID/NIC is required"
    if (!formData.age || Number.parseInt(formData.age) < 1 || Number.parseInt(formData.age) > 120)
      newErrors.age = "Valid age (1-120) required"
    if (!formData.gender) newErrors.gender = "Gender is required"
    if (!formData.budget || Number.parseInt(formData.budget) < 10000) newErrors.budget = "Valid budget required"
    if (formData.medicalConditions.length === 0 && !formData.otherMedicalCondition.trim())
      newErrors.medicalConditions = "Select medical conditions or 'None'"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setSubmitError(null)

    try {
      const patientData = {
        name: formData.name,
        nic: formData.nic,
        age: parseInt(formData.age),
        gender: formData.gender,
        budget: parseInt(formData.budget),
        medical_conditions: formData.medicalConditions.includes("None") ? [] : formData.medicalConditions.filter(cond => cond !== "None"),
        other_medical_condition: formData.otherMedicalCondition,
        allergies: formData.allergies,
        habits: formData.habits.filter(h => ["Smoking", "Alcohol", "Bruxism", "Betel Chewing", "Coffee", "Tea"].includes(h)),
        family_dental_history: formData.familyDentalHistory,
      }

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      })

      const responseText = await response.text()
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`)
        else throw new Error("Invalid response from server")
      }

      if (!response.ok) {
        const errorMessage = responseData.detail || responseData.message || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const pId = responseData.id || responseData._id
      if (pId) {
        localStorage.setItem("currentPatientId", pId.toString())
        setPatientId(pId)
        alert("Patient record saved successfully.")
      } else {
        alert("Patient record saved.")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save patient data"
      setSubmitError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const storedConditions = localStorage.getItem("detectedConditions")
    if (storedConditions) {
      setDetectedConditions(JSON.parse(storedConditions))
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12">
        {/* Top Toolbar */}
        <div className="w-full bg-slate-900 border-b border-slate-800 p-4 shadow-md sticky top-0 z-10">
            <div className="max-w-screen-xl mx-auto flex justify-between items-center px-4">
                <div className="flex items-center space-x-3 text-white">
                    <ClipboardList className="h-6 w-6 text-blue-400" />
                    <h1 className="text-xl font-semibold tracking-wide">Patient Clinical Record</h1>
                </div>
            </div>
        </div>

        <div className="w-full max-w-screen-xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-6">

            {/* Left Column: Form */}
            <div className="flex-1 flex flex-col gap-6">
                
                {/* Demographics Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 p-3 border-b border-slate-200">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                            <User className="h-4 w-4 mr-2" /> Demographics & Core Info
                        </h2>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                            <input
                                type="text" name="name" value={formData.name} onChange={handleInputChange}
                                className={`w-full px-3 py-2 text-sm border rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${errors.name ? "border-red-400" : "border-slate-300"}`}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Patient ID / NIC *</label>
                            <input
                                type="text" name="nic" value={formData.nic} onChange={handleInputChange}
                                className={`w-full px-3 py-2 text-sm border rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${errors.nic ? "border-red-400" : "border-slate-300"}`}
                            />
                            {errors.nic && <p className="mt-1 text-xs text-red-500">{errors.nic}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Age *</label>
                            <input
                                type="number" name="age" value={formData.age} onChange={handleInputChange} min="1" max="120"
                                className={`w-full px-3 py-2 text-sm border rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${errors.age ? "border-red-400" : "border-slate-300"}`}
                            />
                            {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gender *</label>
                            <select
                                name="gender" value={formData.gender} onChange={handleInputChange}
                                className={`w-full px-3 py-2 text-sm border rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${errors.gender ? "border-red-400" : "border-slate-300"}`}
                            >
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Available Budget Constraint (LKR) *</label>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="range" name="budget" min="10000" max="300000" step="5000" value={formData.budget} onChange={handleInputChange}
                                    className="w-full accent-blue-600"
                                />
                                <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded border border-slate-200 min-w-[120px] text-center">
                                    LKR {parseInt(formData.budget).toLocaleString()}
                                </span>
                            </div>
                            {errors.budget && <p className="mt-1 text-xs text-red-500">{errors.budget}</p>}
                        </div>
                    </div>
                </div>

                {/* Medical History Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 p-3 border-b border-slate-200">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                            <Activity className="h-4 w-4 mr-2" /> Clinical History & Parameters
                        </h2>
                    </div>
                    <div className="p-5">
                        
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pre-existing Conditions *</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                            {["Diabetes", "Hypertension", "Heart Disease", "Allergies", "Bone Loss", "Caries", "Crown", "Filling", "Implant", "Missing Teeth", "Root Canal Treatment", "Impacted Tooth"].map((cond) => (
                                <label key={cond} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                                    <input type="checkbox" name="medicalConditions" value={cond} checked={formData.medicalConditions.includes(cond)} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                                    <span>{cond}</span>
                                </label>
                            ))}
                            <label className="flex items-center space-x-2 text-sm text-slate-700 font-medium cursor-pointer">
                                <input type="checkbox" name="medicalConditions" value="None" checked={formData.medicalConditions.includes("None")} onChange={handleInputChange} className="h-4 w-4 text-slate-600 border-slate-300 rounded focus:ring-slate-500" />
                                <span>None / Healthy</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                                <input type="checkbox" name="medicalConditions" value="Other" checked={formData.medicalConditions.includes("Other")} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                                <span>Other (Specify)</span>
                            </label>
                        </div>
                        {formData.medicalConditions.includes("Other") && (
                            <input
                                type="text" name="otherMedicalCondition" value={formData.otherMedicalCondition} onChange={handleInputChange} placeholder="Specify conditions..."
                                className="w-full mt-2 px-3 py-2 text-sm border rounded border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        )}
                        {errors.medicalConditions && <p className="mt-1 text-xs text-red-500">{errors.medicalConditions}</p>}

                        <hr className="my-5 border-slate-200" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Allergies</label>
                                <textarea
                                    name="allergies" value={formData.allergies} onChange={handleInputChange} rows={2} placeholder="N/A"
                                    className="w-full px-3 py-2 text-sm border rounded border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Family Dental History</label>
                                <textarea
                                    name="familyDentalHistory" value={formData.familyDentalHistory} onChange={handleInputChange} rows={2} placeholder="N/A"
                                    className="w-full px-3 py-2 text-sm border rounded border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <hr className="my-5 border-slate-200" />

                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Lifestyle Habits</label>
                        <div className="flex flex-wrap gap-4">
                            {["Smoking", "Alcohol", "Bruxism", "Betel Chewing", "Coffee", "Tea"].map((habit) => (
                                <label key={habit} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-100">
                                    <input type="checkbox" name="habits" value={habit} checked={formData.habits.includes(habit)} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                                    <span>{habit}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        {submitError}
                    </div>
                )}

            </div>

            {/* Right Column: AI Data & Actions */}
            <div className="w-full lg:w-80 flex flex-col gap-6">
                
                {/* AI Findings Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-blue-900 justify-between p-3 flex items-center">
                        <h2 className="text-sm font-bold text-blue-100 uppercase tracking-wider flex items-center">
                            <ScanLine className="h-4 w-4 mr-2" /> AI Diagnostics
                        </h2>
                    </div>
                    <div className="p-4 bg-slate-50">
                        {detectedConditions.length > 0 ? (
                            <div>
                                <p className="text-xs text-slate-500 mb-3 font-medium">Auto-extracted from attached X-ray:</p>
                                <ul className="space-y-2">
                                    {detectedConditions.map((condition, index) => (
                                        <li key={index} className="flex items-center text-sm font-medium text-slate-800 bg-white border border-slate-200 p-2 rounded shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                                            {condition}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                                    These findings will be cross-referenced with your clinical inputs to generate the final treatment plan.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-400">
                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No X-ray analysis linked to this session.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Secure Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 text-slate-600 mb-2">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm font-bold uppercase tracking-wider">HIPAA Compliant</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Data is encrypted and utilized strictly for the generation of medical recommendations. No PHI is shared without explicit consent.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 sticky top-24">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                        {isLoading ? "Committing Record..." : "Save Clinical Record"}
                    </button>

                    <Link
                        href="/recommendations"
                        className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium border transition ${patientId ? "text-slate-900 bg-white border-slate-300 hover:bg-slate-50 shadow-sm" : "text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed pointer-events-none"}`}
                    >
                        Proceed to Treatment Plan
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </div>

            </div>

        </div>
    </div>
  )
}
