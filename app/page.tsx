"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Brain, Upload, FileText, Users, Award, Clock, Shield, Zap, ChevronRight, Star, ArrowRight } from "lucide-react"

export default function HomePage() {
  const [currentStat, setCurrentStat] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const stats = [
    { number: "98%", label: "Accuracy Rate", icon: Award },
    { number: "15min", label: "Analysis Time", icon: Clock },
    { number: "10k+", label: "Patients Helped", icon: Users },
    { number: "24/7", label: "Available", icon: Shield },
  ]

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced computer vision analyzes X-ray images with clinical precision",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Users,
      title: "Personalized Care",
      description: "Tailored recommendations based on patient history and preferences",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Zap,
      title: "Fast Results",
      description: "Get comprehensive analysis and recommendations in minutes",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Shield,
      title: "Clinical Accuracy",
      description: "Validated by dental professionals with 98% accuracy rate",
      gradient: "from-orange-500 to-red-500",
    },
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Prosthodontist",
      content:
        "This AI system has revolutionized how I approach prosthetic recommendations. The accuracy is remarkable.",
      rating: 5,
      avatar: "/placeholder-user.jpg",
    },
    {
      name: "Dr. Michael Chen",
      role: "Oral Surgeon",
      content:
        "The detailed analysis and patient-specific recommendations have improved my treatment planning significantly.",
      rating: 5,
      avatar: "/placeholder-user.jpg",
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "General Dentist",
      content: "User-friendly interface with professional-grade results. My patients love the detailed reports.",
      rating: 5,
      avatar: "/placeholder-user.jpg",
    },
  ]

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [stats.length])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="absolute inset-0 bg-[url('/pattern-dots.png')] opacity-40"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div
              className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient bg-300%">
                  AI-Powered
                </span>
                <br />
                <span className="text-gray-800">Dental Prosthetics</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Transform dental healthcare with intelligent prosthetic recommendations powered by advanced AI and
                computer vision technology
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  href="/upload"
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <Upload className="h-5 w-5 group-hover:animate-bounce" />
                  <span>Start Analysis</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/patient-data"
                  className="group bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl border border-gray-200 hover:border-blue-300 transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                >
                  <FileText className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Patient Data</span>
                </Link>
              </div>
            </div>

            {/* Animated Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div
                    key={index}
                    className={`bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 transform transition-all duration-500 hover:scale-105 ${
                      currentStat === index ? "ring-2 ring-blue-400 shadow-xl" : ""
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 mx-auto mb-3 ${currentStat === index ? "text-blue-600 animate-pulse" : "text-gray-600"}`}
                    />
                    <div className="text-2xl font-bold text-gray-800 mb-1">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-float"></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-20 w-12 h-12 bg-indigo-200 rounded-full opacity-20 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Our AI System?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of dental prosthetic recommendations with cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-100"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Trusted by Dental Professionals</h2>
            <p className="text-xl text-gray-600">See what leading dentists say about our AI system</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-800">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern-hex.png')] opacity-20"></div>

        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Practice?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of dental professionals using AI to provide better patient care
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/upload"
              className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Upload className="h-5 w-5 group-hover:animate-bounce" />
              <span>Upload X-Ray Now</span>
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/recommendations"
              className="group bg-transparent text-white px-8 py-4 rounded-xl font-semibold text-lg border-2 border-white hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Brain className="h-5 w-5" />
              <span>View Demo</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
