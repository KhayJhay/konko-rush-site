import { Apple, Download } from "lucide-react"

import { DOWNLOADS } from "@/data/game"
import { cn } from "@/lib/utils"

/** The two real ways to get the game: App Store (iPhone, iPad, Mac) and the Windows download. */
export function GetButtons({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <a
        href={DOWNLOADS.appStore}
        target="_blank"
        rel="noopener"
        className={cn(
          "cut inline-flex h-14 items-center gap-3 pr-7 pl-6 transition-transform duration-200 hover:translate-x-0.5",
          dark ? "bg-[#0a0b0d] text-[#d4ff3a]" : "bg-primary text-primary-foreground"
        )}
      >
        <Apple aria-hidden="true" className="size-6 shrink-0" />
        <span className="flex flex-col leading-none">
          <span className="text-[0.6875rem] tracking-[0.06em] uppercase opacity-80">Download on the</span>
          <span className="mt-1 text-[1.0625rem] font-semibold">App Store</span>
        </span>
      </a>
      <a
        href={DOWNLOADS.windows}
        target="_blank"
        rel="noopener"
        className={cn("cut inline-flex h-14 items-center gap-3 pr-7 pl-6 transition-colors", dark ? "bg-[#0a0b0d]/12 hover:bg-[#0a0b0d]/20" : "bg-foreground/10 hover:bg-foreground/20")}
      >
        <Download aria-hidden="true" className="size-5 shrink-0" />
        <span className="flex flex-col leading-none">
          <span className="text-[0.6875rem] tracking-[0.06em] uppercase opacity-75">Download for</span>
          <span className="mt-1 text-[1.0625rem] font-semibold">Windows</span>
        </span>
      </a>
    </div>
  )
}
