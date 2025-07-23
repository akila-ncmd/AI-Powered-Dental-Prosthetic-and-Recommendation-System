import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import EnhancedNavigation from "@/components/enhanced-navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AI-Powered Dental Prosthetic Recommendation System",
  description:
    "Transform dental healthcare with our intelligent system that analyzes X-ray images and patient data to provide personalized prosthetic recommendations.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <EnhancedNavigation />
          <main>{children}</main>
          <footer className="bg-gray-50 border-t border-gray-200 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Dental Prosthetic System</h3>
                  <p className="text-gray-600 mb-4">
                    Transforming dental healthcare with advanced AI technology for personalized prosthetic
                    recommendations.
                  </p>
                  <p className="text-gray-500 text-sm">© 2023 DentalAI Pro. All rights reserved.</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">FEATURES</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600">
                        AI Analysis
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600">
                        Patient Data
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600">
                        Recommendations
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600">
                        Reports
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">COMPANY</h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600">
                        About Us
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600">
                        Contact
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-600 hover:text-blue-600">
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
