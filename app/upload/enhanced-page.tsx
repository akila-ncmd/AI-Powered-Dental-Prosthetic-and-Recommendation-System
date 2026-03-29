"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, ImageIcon, CheckCircle, X, Zap, Shield, FileText, Layers, ScanLine, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider"

export default function EnhancedUploadPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [annotatedImageUrl, setAnnotatedImageUrl] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = useCallback((file: File) => {
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            setResult(null)
            setAnnotatedImageUrl(null)
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
        [handleFileSelect]
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
        setResult(null)
        setAnnotatedImageUrl(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleSubmit = async () => {
        if (!selectedFile) {
            alert("Please select an X-ray image first.")
            return
        }

        setIsUploading(true)
        setResult(null)
        setAnnotatedImageUrl(null)

        try {
            const formData = new FormData()
            formData.append("file", selectedFile)

            const response = await fetch(`/api/predict`, {
                method: "POST",
                body: formData,
            })

            const responseText = await response.text()
            let data
            try {
                data = JSON.parse(responseText)
            } catch (parseError) {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${responseText || response.statusText}`)
                } else {
                    throw new Error("Invalid response from server")
                }
            }

            if (!response.ok) {
                const errorMessage = data.detail || data.message || `HTTP ${response.status}: ${response.statusText}`
                throw new Error(errorMessage)
            }

            setResult(data)

            if (data.output_image) {
                setAnnotatedImageUrl(data.output_image)
                localStorage.setItem("annotatedImage", data.output_image)
            }

            if (selectedFile) {
                const uploadedUrl = URL.createObjectURL(selectedFile)
                localStorage.setItem("uploadedImage", uploadedUrl)
            }

            if (data.detected_conditions && Array.isArray(data.detected_conditions)) {
                localStorage.setItem("detectedConditions", JSON.stringify(data.detected_conditions))
            }
        } catch (err) {
            const error = err as Error
            alert(`Analysis failed: ${error.message}`)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-12">
            {/* Top Toolbar */}
            <div className="w-full bg-slate-900 border-b border-slate-800 p-4 shadow-md sticky top-0 z-10">
                <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-4">
                    <div className="flex items-center space-x-3 text-white">
                        <ScanLine className="h-6 w-6 text-blue-400" />
                        <h1 className="text-xl font-semibold tracking-wide">Diagnostic Imaging Dashboard</h1>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-screen-2xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT PANE: Image Viewer */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
                    <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex z-10">
                            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                                <ImageIcon className="h-4 w-4 mr-2" /> X-Ray Viewer
                            </h2>
                        </div>
                        {annotatedImageUrl && (
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded border border-emerald-300">
                                AI Analysis Complete
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-grow flex items-center justify-center bg-slate-900 overflow-hidden relative group">
                        {!previewUrl && (
                            <div className="text-center text-slate-500">
                                <ImageIcon className="h-16 w-16 mx-auto mb-3 opacity-50" />
                                <p>No X-ray loaded.</p>
                                <p className="text-sm">Please upload an image from the right panel.</p>
                            </div>
                        )}

                        {previewUrl && !annotatedImageUrl && (
                            <img src={previewUrl} alt="Original X-ray" className="object-contain max-h-[700px] w-full" />
                        )}

                        {previewUrl && annotatedImageUrl && (
                            <div className="w-full h-full max-h-[700px] flex items-center justify-center">
                                <ReactCompareSlider
                                    itemOne={<ReactCompareSliderImage src={previewUrl} alt="Original X-Ray" />}
                                    itemTwo={<ReactCompareSliderImage src={annotatedImageUrl} alt="AI Annotated" />}
                                    className="w-full h-full object-contain"
                                    style={{maxHeight: '700px'}}
                                />
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-black/60 text-white px-4 py-2 rounded-full text-xs font-medium tracking-widest backdrop-blur-sm">SLIDE TO COMPARE</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: Controls & Data */}
                <div className="flex flex-col gap-6">

                    {/* Image Upload Area */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
                            <Upload className="h-4 w-4 mr-2" /> Image Acquisition
                        </h2>

                        {!previewUrl ? (
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                                    isDragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                                }`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg" onChange={handleFileInputChange} className="hidden" id="file-upload" />
                                <label htmlFor="file-upload" className="cursor-pointer block">
                                    <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-slate-700 mb-1">Upload Radiograph</p>
                                    <p className="text-xs text-slate-500">Drag & Drop or Click to browse (PNG/JPG)</p>
                                </label>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center overflow-hidden">
                                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                                    <span className="text-sm font-medium text-slate-700 truncate">{selectedFile?.name}</span>
                                </div>
                                <button onClick={removeFile} className="text-slate-400 hover:text-red-500 transition-colors ml-3 focus:outline-none">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        <div className="mt-5">
                            <button
                                onClick={handleSubmit}
                                disabled={!previewUrl || isUploading}
                                className={`w-full flex items-center justify-center py-3 px-4 rounded-lg font-semibold transition-all shadow-sm ${
                                    isUploading ? "bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200" :
                                    !previewUrl ? "bg-slate-100 text-slate-400 cursor-not-allowed" :
                                    "bg-blue-600 text-white hover:bg-blue-700 hover:shadow"
                                }`}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500 mr-2"></div>
                                        Processing Logic...
                                    </>
                                ) : (
                                    <>
                                        <Layers className="h-4 w-4 mr-2" />
                                        Run AI Diagnostics
                                    </>
                                )}
                            </button>
                        </div>
                    </div>


                    {/* Detections Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-grow flex flex-col">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center pb-3 border-b border-slate-100">
                            <FileText className="h-4 w-4 mr-2" /> Clinical Findings
                        </h2>

                        {!result ? (
                            <div className="flex-grow flex items-center justify-center flex-col text-slate-400">
                                <Shield className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-sm text-center">Run diagnostics to view<br/>AI-detected conditions.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full justify-between">
                                <div>
                                    <div className="mb-4">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Identified Issues</span>
                                        <ul className="mt-3 space-y-2">
                                            {result.detected_conditions && result.detected_conditions.length > 0 ? (
                                                result.detected_conditions.map((condition: string, index: number) => (
                                                    <li key={index} className="flex items-center p-2.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium">
                                                        <div className="w-2 h-2 rounded-full bg-amber-500 mr-3"></div>
                                                        {condition}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="flex items-center p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
                                                    <CheckCircle className="h-4 w-4 mr-2" /> No abnormalities detected.
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-4">
                                        <div className="text-xs text-slate-500 font-medium tracking-wide">CONFIDENCE ASSESSMENT:</div>
                                        <div className="text-sm text-slate-800 font-semibold mt-1">High Diagnostic Probability</div>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <Link
                                        href="/patient-data"
                                        className="w-full flex justify-center items-center py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors shadow-sm"
                                    >
                                        Proceed to Treatment Plan <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
