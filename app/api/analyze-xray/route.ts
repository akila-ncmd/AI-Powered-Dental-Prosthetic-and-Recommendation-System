import { type NextRequest, NextResponse } from "next/server"
import { aiService } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Please upload JPEG or PNG images." }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Upload image and get analysis
    const uploadResult = await aiService.uploadXRayImage(file)
    const analysis = await aiService.analyzeXRay(file)

    return NextResponse.json({
      success: true,
      data: {
        ...analysis,
        uploadUrl: uploadResult.uploadUrl,
      },
    })
  } catch (error) {
    console.error("X-Ray analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze X-Ray image" }, { status: 500 })
  }
}
