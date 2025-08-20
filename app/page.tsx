"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Brain,
  Upload,
  BarChart3,
  FileText,
  ArrowRight,
  Star,
  Users,
  Award,
  Zap,
  Shield,
  TrendingUp,
} from "lucide-react"

export default function HomePage() {
  const [stats, setStats] = useState({
    analyses: 0,
    accuracy: 0,
    professionals: 0,
    reports: 0,
  })

  // Animate counters on mount
  useEffect(() => {
    const animateCounter = (target: number, key: keyof typeof stats) => {
      let current = 0
      const increment = target / 100
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        setStats((prev) => ({ ...prev, [key]: Math.floor(current) }))
      }, 20)
    }

    animateCounter(15000, "analyses")
    animateCounter(94, "accuracy")
    animateCounter(500, "professionals")
    animateCounter(12000, "reports")
  }, [])

  const features = [
    {
      icon: Brain,
      title: "Advanced AI Analysis",
      description: "YOLO v5 and Mask R-CNN models for precise tooth detection and analysis",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Get comprehensive analysis results in under 2 minutes with 94% accuracy",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security with encrypted data processing and storage",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Award,
      title: "Clinical Validation",
      description: "Validated by dental professionals with proven clinical outcomes",
      gradient: "from-orange-500 to-red-500",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Upload X-Ray",
      description: "Upload panoramic or bitewing X-ray images with drag-and-drop simplicity",
      icon: Upload,
    },
    {
      number: "02",
      title: "Patient Data",
      description: "Input comprehensive patient information for personalized recommendations",
      icon: Users,
    },
    {
      number: "03",
      title: "AI Analysis",
      description: "Our AI models analyze the X-ray and generate treatment recommendations",
      icon: Brain,
    },
    {
      number: "04",
      title: "Generate Report",
      description: "Download professional PDF reports with detailed analysis and recommendations",
      icon: FileText,
    },
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Prosthodontist",
      image: "/placeholder.svg?height=60&width=60",
      content:
        "DentalAI Pro has revolutionized my practice. The accuracy of recommendations and time saved on analysis is incredible.",
      rating: 5,
    },
    {
      name: "Dr. Michael Chen",
      role: "Oral Surgeon",
      image: "/placeholder.svg?height=60&width=60",
      content:
        "The AI-powered analysis provides insights I might have missed. It's like having a second opinion from an expert.",
      rating: 5,
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "General Dentist",
      image: "/placeholder.svg?height=60&width=60",
      content:
        "My patients love the detailed reports. It helps them understand their treatment options better than ever before.",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2 rounded-full mb-8 animate-fade-in">
              <Brain className="h-4 w-4" />
              <span>AI-Powered Dental Analysis</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 animate-slide-up">
              Revolutionize{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Dental Care
              </span>{" "}
              with AI
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed animate-slide-up-delay">
              Advanced AI system that analyzes dental X-rays and generates personalized prosthetic recommendations with
              94% accuracy, helping dental professionals make better treatment decisions.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up-delay-2">
              <Link
                href="/upload"
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <Upload className="h-6 w-6" />
                <span>Start Analysis</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="#how-it-works"
                className="group bg-white text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 flex items-center space-x-2"
              >
                <BarChart3 className="h-6 w-6" />
                <span>See How It Works</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                {stats.analyses.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium">X-Rays Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">{stats.accuracy}%</div>
              <div className="text-gray-600 font-medium">AI Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">{stats.professionals}+</div>
              <div className="text-gray-600 font-medium">Dental Professionals</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">
                {stats.reports.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium">Reports Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powered by{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Advanced AI
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our cutting-edge AI models provide unprecedented accuracy in dental analysis and treatment planning
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl border border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:scale-105"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple 4-step process to get AI-powered dental recommendations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative">
                  <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-blue-600 mb-4">{step.number}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="h-8 w-8 text-blue-300" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Professionals
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what dental professionals are saying about DentalAI Pro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-700 leading-relaxed italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Practice?</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-12">
            Join hundreds of dental professionals who are already using AI to provide better patient care
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/upload"
              className="group bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <Upload className="h-6 w-6" />
              <span>Start Free Analysis</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button className="group bg-transparent border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 flex items-center space-x-2">
              <TrendingUp className="h-6 w-6" />
              <span>View Demo</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
