// AI Service Integration Layer
// This service handles communication with the AI models

export interface XRayAnalysis {
  imageId: string
  detectedTeeth: DetectedTooth[]
  missingTeeth: MissingTooth[]
  boneDensity: BoneDensityAnalysis
  overallHealth: OverallHealthAssessment
  confidence: number
  processingTime: number
}

export interface DetectedTooth {
  toothNumber: number
  position: { x: number; y: number; width: number; height: number }
  condition: "healthy" | "damaged" | "restored" | "missing"
  confidence: number
}

export interface MissingTooth {
  toothNumber: number
  position: { x: number; y: number }
  adjacentTeethHealth: "excellent" | "good" | "fair" | "poor"
  boneQuality: "excellent" | "good" | "fair" | "poor"
}

export interface BoneDensityAnalysis {
  overall: "excellent" | "good" | "fair" | "poor"
  regions: Array<{
    area: string
    density: number
    classification: "D1" | "D2" | "D3" | "D4"
  }>
}

export interface OverallHealthAssessment {
  gumHealth: "excellent" | "good" | "fair" | "poor"
  overallRisk: "low" | "moderate" | "high"
  recommendations: string[]
}

export interface PatientData {
  demographics: {
    age: number
    gender: string
    ethnicity?: string
  }
  medical: {
    conditions: string[]
    medications: string[]
    allergies: string[]
    smokingStatus: "never" | "former" | "current" | "occasional"
  }
  dental: {
    previousWork: string
    oralHygiene: "excellent" | "good" | "fair" | "poor"
  }
  preferences: {
    budget?: number
    insurance?: string
    treatmentPreferences?: string
  }
}

export interface ProstheticRecommendation {
  id: string
  type: "implant" | "bridge" | "denture" | "crown"
  name: string
  suitability: number
  cost: {
    min: number
    max: number
    currency: string
  }
  duration: {
    min: number
    max: number
    unit: "weeks" | "months"
  }
  successRate: {
    min: number
    max: number
  }
  description: string
  pros: string[]
  cons: string[]
  materials: string[]
  contraindications: string[]
  requirements: string[]
}

export interface AIRecommendationResult {
  analysisId: string
  recommendations: ProstheticRecommendation[]
  primaryRecommendation: string
  confidence: number
  reasoning: string
  clinicalNotes: string[]
  timeline: TreatmentTimeline
}

export interface TreatmentTimeline {
  phases: Array<{
    phase: string
    duration: string
    description: string
    requirements: string[]
  }>
  totalDuration: string
}

class AIService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000"
    this.apiKey = process.env.NEXT_PUBLIC_AI_API_KEY || "dev-key"
  }

  async analyzeXRay(imageFile: File): Promise<XRayAnalysis> {
    try {
      // Simulate AI processing time
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const formData = new FormData()
      formData.append("image", imageFile)
      formData.append("analysis_type", "comprehensive")

      // In production, this would call the actual AI API
      // const response = await fetch(`${this.baseUrl}/api/v1/analyze-xray`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //   },
      //   body: formData
      // })

      // For now, return simulated AI analysis results
      return this.simulateXRayAnalysis(imageFile.name)
    } catch (error) {
      console.error("X-Ray analysis failed:", error)
      throw new Error("Failed to analyze X-Ray image")
    }
  }

  async generateRecommendations(xrayAnalysis: XRayAnalysis, patientData: PatientData): Promise<AIRecommendationResult> {
    try {
      // Simulate AI processing time
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In production, this would call the recommendation engine API
      // const response = await fetch(`${this.baseUrl}/api/v1/generate-recommendations`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.apiKey}`,
      //   },
      //   body: JSON.stringify({
      //     xray_analysis: xrayAnalysis,
      //     patient_data: patientData
      //   })
      // })

      return this.simulateRecommendationGeneration(xrayAnalysis, patientData)
    } catch (error) {
      console.error("Recommendation generation failed:", error)
      throw new Error("Failed to generate recommendations")
    }
  }

  private simulateXRayAnalysis(fileName: string): XRayAnalysis {
    return {
      imageId: `img_${Date.now()}`,
      detectedTeeth: [
        {
          toothNumber: 29,
          position: { x: 120, y: 180, width: 25, height: 35 },
          condition: "healthy",
          confidence: 0.95,
        },
        {
          toothNumber: 31,
          position: { x: 180, y: 175, width: 28, height: 38 },
          condition: "healthy",
          confidence: 0.92,
        },
      ],
      missingTeeth: [
        {
          toothNumber: 30,
          position: { x: 150, y: 178 },
          adjacentTeethHealth: "excellent",
          boneQuality: "good",
        },
      ],
      boneDensity: {
        overall: "good",
        regions: [
          {
            area: "posterior_mandible",
            density: 850,
            classification: "D2",
          },
        ],
      },
      overallHealth: {
        gumHealth: "good",
        overallRisk: "low",
        recommendations: [
          "Excellent candidate for implant therapy",
          "Maintain current oral hygiene routine",
          "Consider professional cleaning before treatment",
        ],
      },
      confidence: 0.94,
      processingTime: 1.8,
    }
  }

  private simulateRecommendationGeneration(
    xrayAnalysis: XRayAnalysis,
    patientData: PatientData,
  ): AIRecommendationResult {
    const recommendations: ProstheticRecommendation[] = [
      {
        id: "implant_001",
        type: "implant",
        name: "Dental Implant with Ceramic Crown",
        suitability: this.calculateSuitability("implant", xrayAnalysis, patientData),
        cost: { min: 3000, max: 5000, currency: "USD" },
        duration: { min: 3, max: 6, unit: "months" },
        successRate: { min: 95, max: 98 },
        description: "Titanium implant with ceramic crown providing the most natural solution",
        pros: [
          "Most natural look and feel",
          "Preserves jawbone structure",
          "Long-lasting solution (20+ years)",
          "No impact on adjacent teeth",
        ],
        cons: [
          "Higher upfront cost",
          "Requires surgical procedure",
          "Healing time of 3-6 months",
          "May require bone grafting",
        ],
        materials: ["Titanium implant", "Ceramic crown", "Abutment"],
        contraindications: ["Uncontrolled diabetes", "Heavy smoking", "Insufficient bone"],
        requirements: ["Adequate bone density", "Good oral hygiene", "Non-smoking"],
      },
      {
        id: "bridge_001",
        type: "bridge",
        name: "Fixed Dental Bridge",
        suitability: this.calculateSuitability("bridge", xrayAnalysis, patientData),
        cost: { min: 2000, max: 4000, currency: "USD" },
        duration: { min: 2, max: 4, unit: "weeks" },
        successRate: { min: 85, max: 90 },
        description: "Fixed bridge using adjacent teeth as anchors",
        pros: [
          "Fixed, non-removable solution",
          "Faster treatment completion",
          "No surgical procedure required",
          "Immediate restoration of function",
        ],
        cons: [
          "Requires preparation of healthy teeth",
          "May need replacement after 10-15 years",
          "Difficult to clean underneath",
          "Potential for decay in anchor teeth",
        ],
        materials: ["Porcelain", "Metal framework", "Cement"],
        contraindications: ["Weak adjacent teeth", "Poor oral hygiene"],
        requirements: ["Healthy adjacent teeth", "Good gum health"],
      },
      {
        id: "denture_001",
        type: "denture",
        name: "Partial Denture",
        suitability: this.calculateSuitability("denture", xrayAnalysis, patientData),
        cost: { min: 1200, max: 2500, currency: "USD" },
        duration: { min: 3, max: 6, unit: "weeks" },
        successRate: { min: 75, max: 85 },
        description: "Removable partial denture for missing teeth",
        pros: [
          "Most affordable option",
          "Non-invasive treatment",
          "Easy to repair if damaged",
          "Can be adjusted as needed",
        ],
        cons: [
          "Less stable than fixed options",
          "May affect speech initially",
          "Requires daily removal for cleaning",
          "Can cause gum irritation",
        ],
        materials: ["Acrylic resin", "Metal clasps", "Artificial teeth"],
        contraindications: ["Severe gag reflex", "Limited manual dexterity"],
        requirements: ["Adequate remaining teeth", "Healthy gums"],
      },
    ]

    // Sort by suitability score
    recommendations.sort((a, b) => b.suitability - a.suitability)

    return {
      analysisId: `analysis_${Date.now()}`,
      recommendations,
      primaryRecommendation: recommendations[0].id,
      confidence: 0.92,
      reasoning: this.generateReasoning(recommendations[0], xrayAnalysis, patientData),
      clinicalNotes: this.generateClinicalNotes(xrayAnalysis, patientData),
      timeline: this.generateTimeline(recommendations[0]),
    }
  }

  private calculateSuitability(
    type: "implant" | "bridge" | "denture",
    xrayAnalysis: XRayAnalysis,
    patientData: PatientData,
  ): number {
    let baseScore = 70

    // Age factor
    if (patientData.demographics.age < 65) baseScore += 10
    else if (patientData.demographics.age > 75) baseScore -= 5

    // Smoking factor
    if (patientData.medical.smokingStatus === "never") baseScore += 10
    else if (patientData.medical.smokingStatus === "current") baseScore -= 15

    // Oral hygiene factor
    if (patientData.dental.oralHygiene === "excellent") baseScore += 10
    else if (patientData.dental.oralHygiene === "poor") baseScore -= 10

    // Bone quality factor (for implants)
    if (type === "implant") {
      if (xrayAnalysis.boneDensity.overall === "excellent") baseScore += 15
      else if (xrayAnalysis.boneDensity.overall === "poor") baseScore -= 20
    }

    // Adjacent teeth health (for bridges)
    if (type === "bridge") {
      const adjacentHealth = xrayAnalysis.missingTeeth[0]?.adjacentTeethHealth
      if (adjacentHealth === "excellent") baseScore += 15
      else if (adjacentHealth === "poor") baseScore -= 15
    }

    // Budget consideration
    if (patientData.preferences.budget) {
      const budget = patientData.preferences.budget
      if (type === "implant" && budget >= 3000) baseScore += 5
      else if (type === "bridge" && budget >= 2000 && budget < 3000) baseScore += 5
      else if (type === "denture" && budget < 2000) baseScore += 5
    }

    return Math.min(Math.max(baseScore, 0), 100)
  }

  private generateReasoning(
    recommendation: ProstheticRecommendation,
    xrayAnalysis: XRayAnalysis,
    patientData: PatientData,
  ): string {
    const factors = []

    if (xrayAnalysis.boneDensity.overall === "excellent" || xrayAnalysis.boneDensity.overall === "good") {
      factors.push("excellent bone density suitable for implant placement")
    }

    if (patientData.medical.smokingStatus === "never") {
      factors.push("non-smoking status improves healing outcomes")
    }

    if (patientData.dental.oralHygiene === "excellent" || patientData.dental.oralHygiene === "good") {
      factors.push("good oral hygiene supports long-term success")
    }

    if (patientData.demographics.age < 65) {
      factors.push("optimal age for prosthetic treatment")
    }

    return `Based on the comprehensive analysis, ${recommendation.name.toLowerCase()} is recommended due to ${factors.join(", ")}. The patient's clinical profile indicates a ${recommendation.suitability}% suitability for this treatment option.`
  }

  private generateClinicalNotes(xrayAnalysis: XRayAnalysis, patientData: PatientData): string[] {
    const notes = []

    notes.push(`Patient presents with ${xrayAnalysis.missingTeeth.length} missing tooth/teeth`)
    notes.push(`Bone density assessment: ${xrayAnalysis.boneDensity.overall}`)
    notes.push(`Overall treatment risk: ${xrayAnalysis.overallHealth.overallRisk}`)

    if (patientData.medical.smokingStatus === "current") {
      notes.push("Smoking cessation recommended before treatment")
    }

    if (patientData.preferences.budget) {
      notes.push(`Patient budget consideration: $${patientData.preferences.budget}`)
    }

    return notes
  }

  private generateTimeline(recommendation: ProstheticRecommendation): TreatmentTimeline {
    if (recommendation.type === "implant") {
      return {
        phases: [
          {
            phase: "Initial Consultation",
            duration: "1 week",
            description: "Clinical examination and treatment planning",
            requirements: ["X-rays", "Medical history review", "Treatment consent"],
          },
          {
            phase: "Implant Placement",
            duration: "1 day",
            description: "Surgical placement of titanium implant",
            requirements: ["Pre-operative instructions", "Local anesthesia", "Post-op care"],
          },
          {
            phase: "Healing Period",
            duration: "3-6 months",
            description: "Osseointegration and tissue healing",
            requirements: ["Regular check-ups", "Oral hygiene maintenance", "Temporary restoration if needed"],
          },
          {
            phase: "Crown Placement",
            duration: "2-3 weeks",
            description: "Final crown fabrication and placement",
            requirements: ["Impression taking", "Crown try-in", "Final adjustment"],
          },
        ],
        totalDuration: "4-7 months",
      }
    } else if (recommendation.type === "bridge") {
      return {
        phases: [
          {
            phase: "Initial Consultation",
            duration: "1 week",
            description: "Examination and treatment planning",
            requirements: ["Clinical assessment", "X-rays", "Treatment planning"],
          },
          {
            phase: "Tooth Preparation",
            duration: "1 day",
            description: "Preparation of anchor teeth",
            requirements: ["Local anesthesia", "Tooth preparation", "Temporary bridge"],
          },
          {
            phase: "Bridge Fabrication",
            duration: "1-2 weeks",
            description: "Laboratory fabrication of final bridge",
            requirements: ["Impressions", "Shade matching", "Quality control"],
          },
          {
            phase: "Bridge Placement",
            duration: "1 day",
            description: "Final bridge cementation",
            requirements: ["Bridge try-in", "Occlusal adjustment", "Final cementation"],
          },
        ],
        totalDuration: "2-4 weeks",
      }
    } else {
      return {
        phases: [
          {
            phase: "Initial Consultation",
            duration: "1 week",
            description: "Assessment and impressions",
            requirements: ["Clinical examination", "Impressions", "Bite registration"],
          },
          {
            phase: "Denture Fabrication",
            duration: "2-3 weeks",
            description: "Laboratory fabrication of denture",
            requirements: ["Wax try-in", "Adjustments", "Final processing"],
          },
          {
            phase: "Denture Delivery",
            duration: "1 day",
            description: "Final fitting and adjustments",
            requirements: ["Fit assessment", "Occlusal adjustment", "Patient education"],
          },
          {
            phase: "Follow-up Adjustments",
            duration: "2-4 weeks",
            description: "Post-delivery adjustments as needed",
            requirements: ["Comfort assessment", "Minor adjustments", "Oral hygiene instruction"],
          },
        ],
        totalDuration: "4-6 weeks",
      }
    }
  }

  async uploadXRayImage(file: File): Promise<{ imageId: string; uploadUrl: string }> {
    // Simulate image upload to cloud storage
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const uploadUrl = URL.createObjectURL(file)

    return { imageId, uploadUrl }
  }

  async getAnalysisStatus(analysisId: string): Promise<{
    status: "processing" | "completed" | "failed"
    progress: number
    estimatedTimeRemaining?: number
  }> {
    // Simulate status checking
    return {
      status: "completed",
      progress: 100,
    }
  }
}

export const aiService = new AIService()
