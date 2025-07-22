import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import EnhancedNavigation from "@/components/enhanced-navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AI-Powered Dental Prosthetic Recommendation System",
  description: "Transform dental healthcare with AI-powered prosthetic recommendations",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <EnhancedNavigation />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}
