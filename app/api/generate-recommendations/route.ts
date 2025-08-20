import { type NextRequest, NextResponse } from "next/server"
import { aiService, type XRayAnalysis, type PatientData } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { xrayAnalysis, patientData } = body as {
      xrayAnalysis: XRayAnalysis
      patientData: PatientData
    }

    if (!xrayAnalysis || !patientData) {
      return NextResponse.json({ error: "Missing required data: xrayAnalysis and patientData" }, { status: 400 })
    }

    // Generate AI recommendations
    const recommendations = await aiService.generateRecommendations(xrayAnalysis, patientData)

    return NextResponse.json({
      success: true,
      data: recommendations,
    })
  } catch (error) {
    console.error("Recommendation generation error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
