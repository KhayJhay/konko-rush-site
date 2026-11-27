import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Static export for Vercel (vercel.json serves ./out)
  output: "export",
  images: { unoptimized: true },
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
