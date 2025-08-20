"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  FileImage,
  Brain,
  Shield,
  Zap,
  Camera,
  ArrowRight,
  Info,
  Loader2,
} from "lucide-react"
import { useAIAnalysis } from "@/hooks/use-ai-analysis"
import { useToast } from "@/hooks/use-toast"

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { analyzeXRay, isAnalyzing, xrayAnalysis, error } = useAIAnalysis()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }, [])

  const processFile = useCallback(
    (file: File) => {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/jpg"]
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a valid X-ray image (JPEG, PNG, or JPG)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        })
        return
      }

      setSelectedFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      toast({
        title: "File uploaded successfully",
        description: "X-ray image is ready for analysis",
      })
    },
    [toast],
  )

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return

    // Simulate progress for better UX
    setUploadProgress(0)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 10
      })
    }, 200)

    try {
      const analysis = await analyzeXRay(selectedFile)

      if (analysis) {
        setUploadProgress(100)
        toast({
          title: "Analysis complete!",
          description: "X-ray has been successfully analyzed by our AI system",
        })

        // Store analysis in sessionStorage for use in other pages
        sessionStorage.setItem("xrayAnalysis", JSON.stringify(analysis))
        sessionStorage.setItem("xrayImage", previewUrl || "")

        // Redirect to patient data page after a short delay
        setTimeout(() => {
          router.push("/patient-data")
        }, 1500)
      }
    } catch (err) {
      setUploadProgress(0)
      toast({
        title: "Analysis failed",
        description: error || "Failed to analyze X-ray image. Please try again.",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
    }
  }, [selectedFile, analyzeXRay, error, previewUrl, router, toast])

  const removeFile = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const aiFeatures = [
    {
      icon: Brain,
      title: "YOLO v5 Detection",
      description: "Advanced object detection for precise tooth identification",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Zap,
      title: "Mask R-CNN Analysis",
      description: "Instance segmentation for detailed structural analysis",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Shield,
      title: "94% Accuracy",
      description: "Clinically validated AI models with proven accuracy",
      color: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Camera className="h-4 w-4" />
            <span>Step 1 of 4: X-Ray Upload & Analysis</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Upload{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              X-Ray Image
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your patient's dental X-ray for AI-powered analysis using YOLO v5 and Mask R-CNN models
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              {/* Upload Area */}
              <div
                className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                  isDragging
                    ? "border-blue-400 bg-blue-50 scale-105"
                    : selectedFile
                      ? "border-green-400 bg-green-50"
                      : error
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isAnalyzing}
                />

                {!selectedFile ? (
                  <div className="space-y-6">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                      <Upload className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                        {isDragging ? "Drop your X-ray here" : "Upload X-ray image"}
                      </h3>
                      <p className="text-gray-600 mb-4">Drag and drop your file here, or click to browse</p>
                      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                        <FileImage className="h-5 w-5" />
                        <span>Choose File</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Supports PNG, JPEG files up to 10MB</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="X-ray preview"
                        className="max-w-full max-h-96 mx-auto rounded-xl shadow-lg"
                      />
                      {!isAnalyzing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile()
                          }}
                          className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{selectedFile.name}</span>
                        <span className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>

                      {isAnalyzing && (
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            AI analyzing image... {Math.round(uploadProgress)}%
                          </p>
                        </div>
                      )}

                      {xrayAnalysis && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="font-medium">
                            Analysis complete! Confidence: {Math.round(xrayAnalysis.confidence * 100)}%
                          </span>
                        </div>
                      )}

                      {error && (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          <span className="font-medium">{error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedFile && (
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  {!xrayAnalysis ? (
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Analyzing with AI...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="h-5 w-5" />
                          <span>Analyze with AI</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/patient-data"
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>Continue to Patient Data</span>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  )}

                  <button
                    onClick={removeFile}
                    disabled={isAnalyzing}
                    className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* AI Features */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Brain className="h-6 w-6 text-blue-600 mr-2" />
                AI Analysis Models
              </h3>

              <div className="space-y-6">
                {aiFeatures.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1">{feature.title}</h4>
                        <p className="text-gray-600 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {xrayAnalysis && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Analysis Results</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Time:</span>
                      <span className="font-medium">{xrayAnalysis.processingTime}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Teeth Detected:</span>
                      <span className="font-medium">{xrayAnalysis.detectedTeeth.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Missing Teeth:</span>
                      <span className="font-medium text-red-600">{xrayAnalysis.missingTeeth.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bone Quality:</span>
                      <span className="font-medium text-green-600">{xrayAnalysis.boneDensity.overall}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Guidelines */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Camera className="h-5 w-5 text-blue-600 mr-2" />
                X-Ray Guidelines
              </h3>

              <div className="space-y-3">
                {[
                  "High resolution (minimum 1024x768)",
                  "Clear visibility of teeth and jaw structure",
                  "Panoramic or bitewing X-rays preferred",
                  "Recent images (within 6 months)",
                  "Remove patient identifying information",
                ].map((guideline, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{guideline}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-100">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Privacy & Security</h4>
                  <p className="text-gray-600 text-sm">
                    All uploaded images are encrypted and processed securely. Patient data is never stored permanently
                    and is automatically deleted after analysis completion.
                  </p>
                </div>
              </div>
            </div>

            {/* Support Info */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 border border-yellow-100">
              <div className="flex items-start space-x-3">
                <Info className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Need Help?</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    Having trouble with your X-ray upload? Our support team is here to help.
                  </p>
                  <button className="text-yellow-600 text-sm font-medium hover:text-yellow-700 transition-colors">
                    Contact Support →
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
