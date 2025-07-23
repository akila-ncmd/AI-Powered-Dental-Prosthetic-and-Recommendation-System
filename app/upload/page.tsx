"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, Check, FileText, ImageIcon, AlertCircle, ChevronRight, Brain } from "lucide-react"
import Link from "next/link"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    processFile(droppedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file: File) => {
    // Reset states
    setError(null)
    setUploadComplete(false)

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg"]
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid X-ray image (JPEG or PNG)")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit")
      return
    }

    setFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 5
      })
    }, 100)

    // Simulate API call
    setTimeout(() => {
      clearInterval(interval)
      setUploadProgress(100)
      setIsUploading(false)
      setUploadComplete(true)
    }, 2000)
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upload X-Ray Image</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload a dental X-ray image for AI analysis and personalized prosthetic recommendations
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 transition-all ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                } ${error ? "border-red-300 bg-red-50" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                  className="hidden"
                />

                <div className="text-center">
                  {!preview ? (
                    <>
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Drag & drop your X-ray image here</h3>
                      <p className="text-gray-500 mb-4">or click to browse (PNG, JPEG up to 5MB)</p>
                    </>
                  ) : (
                    <div className="relative">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt="X-ray preview"
                        className="max-h-80 mx-auto rounded-lg shadow-md"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setFile(null)
                          setPreview(null)
                          setUploadComplete(false)
                        }}
                        className="absolute top-2 right-2 bg-gray-800/70 text-white p-1 rounded-full hover:bg-gray-900/90"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 flex items-center justify-center text-red-600">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm font-medium text-gray-900 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Complete */}
              {uploadComplete && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Upload successful!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your X-ray has been uploaded and is ready for analysis.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={!file || isUploading || uploadComplete}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : uploadComplete ? (
                    <span className="flex items-center">
                      <Check className="mr-2 h-5 w-5" />
                      Processed
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Analyze X-Ray
                    </span>
                  )}
                </button>

                {uploadComplete && (
                  <Link
                    href="/patient-data"
                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium text-lg shadow hover:shadow-md transition-all duration-300 flex items-center justify-center"
                  >
                    <span className="flex items-center">
                      Continue to Patient Data
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Guidelines Section */}
            <div className="bg-gray-50 border-t border-gray-200 p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">X-Ray Upload Guidelines</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span className="text-gray-600">Upload clear, high-resolution X-ray images</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span className="text-gray-600">Ensure the X-ray shows the complete dental arch</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span className="text-gray-600">Panoramic and bitewing X-rays work best</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span className="text-gray-600">Remove any personal identifying information</span>
                </li>
              </ul>
            </div>
          </div>

          {/* AI Features */}
          <div className="mt-12 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">How Our AI Analyzes Your X-Ray</h3>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <ImageIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Image Processing</h4>
                  <p className="text-gray-600">
                    Advanced algorithms enhance and normalize your X-ray for optimal analysis
                  </p>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">AI Detection</h4>
                  <p className="text-gray-600">Neural networks identify missing teeth and analyze bone structure</p>
                </div>

                <div className="bg-green-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Recommendation</h4>
                  <p className="text-gray-600">
                    AI generates personalized prosthetic options based on clinical evidence
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
