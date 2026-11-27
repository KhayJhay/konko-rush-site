import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter, Inter_Tight } from "next/font/google"

import { DOWNLOADS } from "@/data/game"

import "./globals.css"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" })
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["300", "400", "600"], style: ["normal", "italic"], display: "swap" })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" })

const title = "KonKo Rush: race the tin toy cars of Ghana"
const description =
  "KonKo Rush is an arcade combat racer starring the handmade tin toy cars of Ghana. Drift, boost, jump and fire items on seven circuits, from seafront Accra to the Mole savannah. Free on iPhone, iPad, Mac and Windows."

export const metadata: Metadata = {
  title,
  description,
  icons: { icon: "/assets/img/favicon.png", apple: "/assets/img/icon.png" },
  openGraph: { type: "website", title, description, images: ["/assets/img/keyart.jpg"] },
  twitter: { card: "summary_large_image" },
  // Safari on iPhone shows an "Open in App Store" banner
  itunes: { appId: DOWNLOADS.appStoreId },
}

export const viewport: Viewport = { themeColor: "#0a0b0d" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="night" className={`dark ${inter.variable} ${interTight.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
