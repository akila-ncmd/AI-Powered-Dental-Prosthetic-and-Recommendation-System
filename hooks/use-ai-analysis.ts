"use client"

import { useState, useCallback } from "react"
import type { XRayAnalysis, PatientData, AIRecommendationResult } from "@/lib/ai-service"

interface UseAIAnalysisReturn {
  // State
  isAnalyzing: boolean
  isGeneratingRecommendations: boolean
  xrayAnalysis: XRayAnalysis | null
  recommendations: AIRecommendationResult | null
  error: string | null

  // Actions
  analyzeXRay: (file: File) => Promise<XRayAnalysis | null>
  generateRecommendations: (patientData: PatientData) => Promise<AIRecommendationResult | null>
  reset: () => void
}

export function useAIAnalysis(): UseAIAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false)
  const [xrayAnalysis, setXrayAnalysis] = useState<XRayAnalysis | null>(null)
  const [recommendations, setRecommendations] = useState<AIRecommendationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeXRay = useCallback(async (file: File): Promise<XRayAnalysis | null> => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("/api/analyze-xray", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze X-Ray")
      }

      const result = await response.json()
      const analysis = result.data as XRayAnalysis

      setXrayAnalysis(analysis)
      return analysis
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const generateRecommendations = useCallback(
    async (patientData: PatientData): Promise<AIRecommendationResult | null> => {
      if (!xrayAnalysis) {
        setError("X-Ray analysis required before generating recommendations")
        return null
      }

      setIsGeneratingRecommendations(true)
      setError(null)

      try {
        const response = await fetch("/api/generate-recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            xrayAnalysis,
            patientData,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate recommendations")
        }

        const result = await response.json()
        const recommendationResult = result.data as AIRecommendationResult

        setRecommendations(recommendationResult)
        return recommendationResult
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)
        return null
      } finally {
        setIsGeneratingRecommendations(false)
      }
    },
    [xrayAnalysis],
  )

  const reset = useCallback(() => {
    setXrayAnalysis(null)
    setRecommendations(null)
    setError(null)
    setIsAnalyzing(false)
    setIsGeneratingRecommendations(false)
  }, [])

  return {
    isAnalyzing,
    isGeneratingRecommendations,
    xrayAnalysis,
    recommendations,
    error,
    analyzeXRay,
    generateRecommendations,
    reset,
  }
}
