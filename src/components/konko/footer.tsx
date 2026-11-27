import Link from "next/link"
import { cn } from "@/lib/utils"

import { Brand } from "./brand"

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("gutter pb-28", className)}>
      <div className="border-t border-foreground/20 pt-7">
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
          <Link href="/" aria-label="KonKo Rush, home">
            <Brand className="inline-flex items-center gap-2.5 font-display text-xl font-semibold" />
          </Link>
          <nav aria-label="Footer" data-veil className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem] [&_a]:underline-offset-4 [&_a:hover]:underline">
            <Link href="/#tracks">Tracks</Link>
            <Link href="/#garage">Garage</Link>
            <a href="/support.html">Support</a>
            <a href="/privacy.html">Privacy</a>
          </nav>
        </div>
        <div className="mt-8 flex flex-wrap justify-between gap-x-10 gap-y-2 text-sm text-muted-foreground">
          <p>© 2026 Kudjo Ewusi Mensah. All rights reserved.</p>
          <p>Konko cars are a Ghanaian toy-making tradition. Every label in the game is invented.</p>
        </div>
      </div>
    </footer>
  )
}
