import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Static export for Vercel (vercel.json serves ./out)
  output: "export",
  images: { unoptimized: true },
  devIndicators: false,
  ...(process.env.NODE_ENV === "development"
    ? { rewrites: async () => [{ source: "/:page(support|privacy).html", destination: "/:page" }] }
    : {}),
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
