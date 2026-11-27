import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter, Inter_Tight } from "next/font/google"

import { DOWNLOADS, SITE } from "@/data/game"

import "./globals.css"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" })
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["300", "400", "600"], style: ["normal", "italic"], display: "swap" })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" })

const title = "KonKo Rush: tin toy car racing game from Ghana | iPhone, iPad, Mac and Windows"
const description =
  "Free arcade combat racing game for iPhone, iPad, Mac and Windows. Race handmade tin toy cars on eight circuits across Ghana, from Accra's seafront to the Kakum canopy. Drift, boost, fire items and top the online leaderboards."
const share = "Free arcade combat racing game. Race handmade tin toy cars on eight circuits across Ghana."

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title,
  description,
  alternates: { canonical: "/" },
  icons: { icon: "/assets/img/favicon.png", apple: "/assets/img/icon.png" },
  openGraph: { type: "website", siteName: "KonKo Rush", url: "/", title: "KonKo Rush: race the tin toy cars of Ghana", description: share, images: ["/assets/img/keyart.jpg"] },
  twitter: { card: "summary_large_image", title: "KonKo Rush: race the tin toy cars of Ghana", description: share, images: ["/assets/img/keyart.jpg"] },
  // Safari on iPhone shows an "Open in App Store" banner
  itunes: { appId: DOWNLOADS.appStoreId },
}

export const viewport: Viewport = { themeColor: "#0a0b0d" }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="night" className={`dark ${inter.variable} ${interTight.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["VideoGame", "MobileApplication"],
              name: "KonKo Rush",
              url: `${SITE}/`,
              description: "Arcade combat racing game starring the handmade tin toy cars of Ghana, on eight circuits based on real Ghanaian places.",
              image: `${SITE}/assets/img/keyart.jpg`,
              genre: ["Racing", "Arcade"],
              gamePlatform: ["iPhone", "iPad", "Mac", "Windows"],
              operatingSystem: "iOS, macOS, Windows",
              applicationCategory: "GameApplication",
              playMode: ["SinglePlayer", "MultiPlayer"],
              contentRating: "4+",
              inLanguage: "en",
              author: { "@type": "Person", name: "Kudjo Ewusi Mensah" },
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              installUrl: DOWNLOADS.appStore,
              sameAs: [DOWNLOADS.appStore],
            }),
          }}
        />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
