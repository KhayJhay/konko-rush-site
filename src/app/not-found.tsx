import type { Metadata } from "next"

import { Nav } from "@/components/konko/chrome"

export const metadata: Metadata = { title: "Page not found | KonKo Rush", description: "This page doesn't exist." }

export default function NotFound() {
  return (
    <>
      <Nav home={false} />
      <main id="main" className="gutter flex min-h-svh flex-col justify-center gap-6">
        <p className="hud text-signal">404</p>
        <h1 className="display-xl">Off the track.</h1>
        <p className="text-muted-foreground">That page doesn&rsquo;t exist. Head back to the start line.</p>
        {/* a plain link: the 404 page is served by nginx outside the app's router */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="cut inline-flex h-12 w-fit items-center bg-primary px-7 font-semibold tracking-[0.03em] text-primary-foreground uppercase">
          Back home
        </a>
      </main>
    </>
  )
}
