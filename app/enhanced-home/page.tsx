"use client"

import Link from "next/link"
import {
  ArrowRight,
  Brain,
  Shield,
  Zap,
  Users,
  Star,
  CheckCircle,
  Play,
  Award,
  TrendingUp,
  Sparkles,
} from "lucide-react"
import { useState, useEffect } from "react"

export default function EnhancedHomePage() {
  const [currentStat, setCurrentStat] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const stats = [
    { number: "98%", label: "Accuracy Rate", icon: Award },
    { number: "50K+", label: "Analyses Completed", icon: TrendingUp },
    { number: "500+", label: "Dental Professionals", icon: Users },
    { number: "24/7", label: "AI Availability", icon: Zap },
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Oral Surgeon",
      content: "DentalAI Pro has revolutionized my practice. The accuracy is incredible!",
      rating: 5,
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Dr. Michael Chen",
      role: "Prosthodontist",
      content: "The AI recommendations are spot-on and save me hours of analysis time.",
      rating: 5,
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "General Dentist",
      content: "My patients love the detailed reports and visual explanations.",
      rating: 5,
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ]

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section with Enhanced Animations */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 medical-pattern opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? "animate-slide-up" : "opacity-0"}`}>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8 animate-pulse-glow">
                <Sparkles className="h-4 w-4 mr-2" />
                Revolutionary AI Technology
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                <span className="block">AI-Powered</span>
                <span className="block gradient-text animate-gradient">Dental Diagnostics</span>
                <span className="block text-4xl md:text-5xl mt-4 text-gray-600">Reimagined</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Transform dental healthcare with our intelligent system that analyzes X-ray images and patient data to
                provide <span className="gradient-text font-semibold">personalized prosthetic recommendations</span>{" "}
                with unprecedented accuracy.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  href="/upload"
                  className="group relative inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl hover-lift hover-glow transition-all duration-300 animate-pulse-glow"
                >
                  <Brain className="mr-3 h-6 w-6 group-hover:animate-spin" />
                  Start AI Analysis
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </Link>

                <button className="group inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-2xl shadow-xl hover-lift transition-all duration-300">
                  <Play className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-float"></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-indigo-200 rounded-full opacity-30 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-12 h-12 bg-blue-300 rounded-full opacity-25 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Stats Section */}
      <div className="relative -mt-16 mb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-8 animate-scale-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div
                    key={index}
                    className={`text-center transition-all duration-500 ${
                      currentStat === index ? "scale-110 animate-pulse-glow" : ""
                    }`}
                  >
                    <Icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold gradient-text mb-1">{stat.number}</div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Choose <span className="gradient-text">DentalAI Pro</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our advanced AI system combines computer vision and machine learning to deliver precise, personalized dental
            prosthetic recommendations that transform patient care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Brain,
              title: "AI-Powered Analysis",
              description:
                "Advanced computer vision analyzes X-ray images to identify missing teeth and optimal prosthetic solutions.",
              color: "from-blue-500 to-blue-600",
              delay: "0s",
            },
            {
              icon: Users,
              title: "Personalized Care",
              description: "Considers patient demographics, medical history, and budget for tailored recommendations.",
              color: "from-indigo-500 to-indigo-600",
              delay: "0.1s",
            },
            {
              icon: Zap,
              title: "Lightning Fast",
              description: "Get comprehensive prosthetic recommendations in minutes, not hours or days.",
              color: "from-purple-500 to-purple-600",
              delay: "0.2s",
            },
            {
              icon: Shield,
              title: "Clinical Accuracy",
              description: "Trained on thousands of cases to ensure reliable, evidence-based recommendations.",
              color: "from-teal-500 to-teal-600",
              delay: "0.3s",
            },
          ].map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group glass-card rounded-2xl p-8 hover-lift transition-all duration-500 animate-slide-up"
                style={{ animationDelay: feature.delay }}
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:gradient-text transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by <span className="gradient-text">Dental Professionals</span>
            </h2>
            <p className="text-xl text-gray-600">See what leading dentists say about DentalAI Pro</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-8 hover-lift animate-slide-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-blue-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700"></div>
        <div className="absolute inset-0 dna-helix opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Practice?</h2>
            <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
              Join hundreds of dental professionals who trust DentalAI Pro for accurate, efficient prosthetic
              recommendations that improve patient outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/upload"
                className="group inline-flex items-center px-10 py-4 text-lg font-semibold text-blue-600 bg-white rounded-2xl shadow-2xl hover-lift transition-all duration-300"
              >
                Start Your First Analysis
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="flex items-center text-white/80">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
