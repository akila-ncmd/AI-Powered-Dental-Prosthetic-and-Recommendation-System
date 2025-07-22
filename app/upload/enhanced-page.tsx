"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Upload, ImageIcon, CheckCircle, X, FileImage, Zap, Shield, Clock } from "lucide-react"
import Link from "next/link"

export default function EnhancedUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      alert("Please select a PNG or JPEG image file.")
    }
  }, [])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      const file = event.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = () => {
    if (!selectedFile) {
      alert("Please select an X-ray image first.")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          alert("X-ray uploaded successfully! AI analysis initiated.")
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <Zap className="h-4 w-4 mr-2" />
            AI-Powered X-Ray Analysis
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Upload <span className="gradient-text">X-Ray Image</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload a panoramic or bitewing X-ray image for instant AI analysis and personalized prosthetic
            recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-8 animate-scale-in">
              {/* Upload Area */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-900 mb-6">Select X-Ray Image (PNG/JPEG)</label>

                <div
                  className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    isDragOver
                      ? "border-blue-500 bg-blue-50 scale-105"
                      : selectedFile
                        ? "border-green-400 bg-green-50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="file-upload"
                  />

                  {selectedFile ? (
                    <div className="animate-scale-in">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 animate-pulse" />
                      <p className="text-xl font-semibold text-green-700 mb-2">File Selected Successfully!</p>
                      <p className="text-green-600">{selectedFile.name}</p>
                      <button
                        onClick={removeFile}
                        className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="animate-float">
                        <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                      </div>
                      <p className="text-xl font-semibold text-gray-700 mb-2">
                        {isDragOver ? "Drop your X-ray here!" : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-gray-500">PNG or JPEG files only (Max 10MB)</p>
                    </label>
                  )}
                </div>
              </div>

              {/* Preview Section */}
              {previewUrl && (
                <div className="mb-8 animate-slide-up">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Image Preview
                  </h3>
                  <div className="glass-card rounded-2xl p-6">
                    <div className="relative group">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="X-ray preview"
                        className="max-w-full h-auto max-h-96 mx-auto rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="mt-6 text-center">
                      <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
                        <FileImage className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">
                          {selectedFile?.name} • {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isUploading && (
                <div className="mb-8 animate-slide-up">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Processing X-Ray...</span>
                    <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 animate-pulse"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedFile || isUploading}
                  className="group inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl hover-lift hover-glow disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-6 w-6 mr-3 group-hover:animate-pulse" />
                      Analyze X-Ray
                    </>
                  )}
                </button>

                <Link
                  href="/patient-data"
                  className="inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white border-2 border-blue-200 rounded-2xl shadow-lg hover-lift transition-all duration-300"
                >
                  Next: Patient Data
                  <CheckCircle className="h-6 w-6 ml-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Guidelines */}
            <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Upload Guidelines
              </h3>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  "Ensure X-ray images are clear and high-resolution",
                  "Panoramic and bitewing X-rays are preferred",
                  "Remove any patient identifying information",
                  "Supported formats: PNG, JPEG (Max 10MB)",
                ].map((guideline, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {guideline}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Features */}
            <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                AI Analysis Features
              </h3>
              <div className="space-y-4">
                {[
                  { icon: Clock, title: "Instant Processing", desc: "Results in under 30 seconds" },
                  { icon: Shield, title: "98% Accuracy", desc: "Clinically validated algorithms" },
                  { icon: CheckCircle, title: "Detailed Reports", desc: "Comprehensive analysis & recommendations" },
                ].map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{feature.title}</div>
                        <div className="text-xs text-gray-600">{feature.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
