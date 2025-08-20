import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { EnhancedNavigation } from "@/components/enhanced-navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DentalAI Pro - AI-Powered Dental Prosthetic Recommendations",
  description: "Advanced AI system for analyzing dental X-rays and generating personalized prosthetic recommendations",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <EnhancedNavigation />
          <main>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
