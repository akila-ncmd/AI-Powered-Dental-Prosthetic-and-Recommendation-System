/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable better debugging and silence workspace-root warnings
  productionBrowserSourceMaps: true,
  outputFileTracingRoot: process.cwd(),
  // Proxy API requests to backend to avoid CORS issues
  async rewrites() {
    return [
      // PDF API proxy - must be first to override general /api/:path*
      {
        source: '/api/pdf/:path*',
        destination: 'http://127.0.0.1:5000/:path*',
      },
      // Add specific rewrites for patient endpoints on port 8000
      {
        source: '/api/patients/:path*',
        destination: 'http://127.0.0.1:8000/patients/:path*',
      },
      {
        source: '/api/ai-recommendations/:path*',
        destination: 'http://127.0.0.1:8000/ai-recommendations/:path*',
      },
      {
        source: '/api/recommendations/:path*',
        destination: 'http://127.0.0.1:8000/recommendations/:path*',
      },
      // General API proxy
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ]
  },
}

export default nextConfig