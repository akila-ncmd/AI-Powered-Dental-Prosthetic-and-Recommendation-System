"use client"

import { useState } from "react"

type Recommendation = {
  type: string
  suitability: number
  description: string
  pros: string[]
  cons: string[]
  cost: string
  duration: string
  maintenance: string
}

export default function RecommendationsPage() {
  const [selectedRec, setSelectedRec] = useState<string>("implant")
  
  const recommendations: Record<string, Recommendation> = {
    implant: {
      type: "Dental Implant",
      suitability: 92,
      description: "A titanium post surgically placed into the jawbone with an attached crown that looks and functions like a natural tooth.",
      pros: [
        "Most natural look and feel",
        "Preserves bone structure",
        "Long-lasting solution (20+ years)",
        "No impact on adjacent teeth"
      ],
      cons: [
        "Higher upfront cost",
        "Requires surgery",
        "Healing time of 3-6 months",
        "May require bone grafting"
      ],
      cost: "$3,000 - $4,500 per tooth",
      duration: "3-6 months total treatment time",
      maintenance: "Regular brushing, flossing, and dental check-ups"
    },
    bridge: {
      type: "Dental Bridge",
      suitability: 78,
      description: "A fixed prosthetic device that bridges the gap created by one or more missing teeth, anchored to adjacent teeth.",
      pros: [
        "Less expensive than implants",
        "No surgery required",
        "Shorter treatment time",
        "Restores smile and function quickly"
      ],
      cons: [
        "Adjacent teeth must be prepared (filed down)",
        "May need replacement after 7-10 years",
        "Can trap food particles",
        "Doesn't prevent bone loss"
      ],
      cost: "$2,000 - $3,000 per unit",
      duration: "2-4 weeks total treatment time",
      maintenance: "Special flossing techniques required"
    },
    denture: {
      type: "Partial Denture",
      suitability: 65,
      description: "A removable replacement for missing teeth and surrounding tissues, made of acrylic, metal, or nylon.",
      pros: [
        "Most affordable option",
        "Non-invasive procedure",
        "Easy to repair if damaged",
        "Can replace multiple teeth at once"
      ],
      cons: [
        "Less stable than fixed options",
        "May affect speech initially",
        "Needs to be removed for cleaning",
        "Can cause gum irritation"
      ],
      cost: "$1,000 - $2,500",\
      duration: "3-
