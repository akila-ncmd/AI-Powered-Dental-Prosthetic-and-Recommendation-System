"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SmileIcon as Tooth, Menu, X, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"

export default function EnhancedNavigation() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/upload", label: "Upload X-Ray" },
    { href: "/patient-data", label: "Patient Data" },
    { href: "/recommendations", label: "Recommendations" },
    { href: "/report", label: "Report" },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-card shadow-2xl" : "bg-white/90 backdrop-blur-sm shadow-lg"
      } border-b border-blue-100`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Tooth className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors animate-float" />
                <Sparkles className="h-4 w-4 text-blue-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold gradient-text">DentalAI Pro</span>
                <span className="text-xs text-blue-500 font-medium">AI-Powered Diagnostics</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover-lift ${
                  pathname === item.href
                    ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg animate-pulse-glow"
                    : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/80"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {item.label}
                {pathname === item.href && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 opacity-20 animate-pulse"></div>
                )}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-2 glass-card rounded-b-2xl">
              {navItems.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    pathname === item.href
                      ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg"
                      : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/80"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
