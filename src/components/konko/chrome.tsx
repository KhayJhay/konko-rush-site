"use client"

import Link from "next/link"
import { ArrowUp } from "lucide-react"
import { useMotionValueEvent, useScroll } from "motion/react"
import { useMemo, useRef, useState } from "react"

import { Matrix } from "@/components/ui/matrix"
import { NAV, SCENES } from "@/data/game"
import TRACKS from "@/data/tracks.json"
import { matrixText } from "@/lib/matrix-text"
import { cn } from "@/lib/utils"

import { Brand } from "./brand"
import { useScene } from "./field/bus"

export function Nav({ home = true }: { home?: boolean }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-28 before:bg-linear-to-b before:from-background before:from-35% before:via-background/80 before:via-65% before:to-transparent before:content-['']">
      <div className="gutter flex h-[4.5rem] items-center justify-between">
        <Link href="/" className="pointer-events-auto" aria-label="KonKo Rush, home">
          <Brand className="inline-flex items-center gap-2.5 font-display text-[1.125rem] font-semibold tracking-[-0.01em] whitespace-nowrap" />
        </Link>
        <nav aria-label="Main" className="pointer-events-auto flex items-center gap-1 text-[0.9375rem]">
          {NAV.map(({ href, label }) => (
            <a key={href} href={href} className={cn("rounded-full px-3.5 py-2 text-foreground/80 transition-colors hover:text-foreground", label === "Support" ? "max-sm:px-2" : "hidden lg:block")}>
              {label}
            </a>
          ))}
          <a
            href={home ? "#get" : "/#get"}
            className="cut ml-2 inline-flex h-10 items-center bg-primary px-5 text-sm font-semibold tracking-[0.04em] whitespace-nowrap text-primary-foreground uppercase transition-transform duration-200 hover:translate-x-0.5 max-sm:hidden"
          >
            Get the game
          </a>
        </nav>
      </div>
    </header>
  )
}

/** Race HUD: your position climbs from 6/6 to 1/6 as you scroll down the page. */
export function Dock() {
  const scene = useScene()
  const { scrollYProgress } = useScroll()
  const [pos, setPos] = useState(6)
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.max(1, 6 - Math.floor(v * 5.999))
    setPos((p) => (p === next ? p : next))
  })
  const m = matrixText(`${pos}/6`)
  const last = scene.id === "get"
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 max-sm:bottom-3">
      <div className="pointer-events-auto flex h-[3.25rem] items-center gap-3 rounded-full border border-white/10 bg-[#0e1013]/92 pr-1.5 pl-4 text-[#f4f4f2] shadow-[0_14px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <span className="flex items-end gap-1.5 text-[#d4ff3a]">
          <span aria-hidden="true" className="font-mono text-[0.6875rem] leading-none text-[#9ba0a8]">POS</span>
          <Matrix rows={7} cols={m.cols} pattern={m.frame} size={2.2} gap={0.9} ariaLabel={`Position ${pos} of 6`} palette={{ on: pos === 1 ? "#d4ff3a" : "#f4f4f2", off: "#3a3e45" }} />
        </span>
        <span aria-hidden="true" className="h-4 w-px bg-white/15" />
        <span className="min-w-[5.4rem] text-sm">{scene.label}</span>
        {last ? (
          <a href="#top" className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20" aria-label="Back to the grid">
            <ArrowUp className="size-4" />
          </a>
        ) : (
          <a href="#get" className="cut inline-flex h-10 items-center bg-[#d4ff3a] px-4.5 text-sm font-semibold tracking-[0.04em] text-[#0a0b0d] uppercase">
            <span className="sm:hidden">Get it</span>
            <span className="max-sm:hidden">Get the game</span>
          </a>
        )}
      </div>
    </div>
  )
}

/** The Accra Coastal Circuit as a minimap: sections sit on the lap, the lime dot is you. */
export function Minimap() {
  const scene = useScene()
  const { scrollYProgress } = useScroll()
  const dot = useRef<SVGCircleElement>(null)
  const path = useRef<SVGPathElement>(null)
  const pts = TRACKS.coast as number[][]
  const d = useMemo(() => "M" + pts.map(([x, z]) => `${(x * 60 + 40).toFixed(1)} ${(z * 60 + 64).toFixed(1)}`).join(" L") + " Z", [pts])
  const marks = useMemo(() => SCENES.map((_, i) => pts[Math.floor((i / SCENES.length) * pts.length)]), [pts])
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const p = path.current, c = dot.current
    if (!p || !c) return
    const at = p.getPointAtLength(p.getTotalLength() * Math.min(0.999, v))
    c.setAttribute("cx", String(at.x))
    c.setAttribute("cy", String(at.y))
  })
  return (
    <nav aria-label="Sections" className="fixed top-1/2 right-2 z-30 hidden -translate-y-1/2 rounded-xl border border-foreground/10 bg-background/70 p-1.5 backdrop-blur-md lg:block">
      <svg width="46" height="74" viewBox="0 0 80 128" aria-hidden="true" className="text-foreground">
        <path ref={path} d={d} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.2" strokeLinejoin="round" />
        {marks.map(([x, z], i) => (
          <circle key={i} cx={x * 60 + 40} cy={z * 60 + 64} r={2.6} className={cn(scene.index >= i ? "fill-foreground" : "fill-background stroke-foreground/50")} strokeWidth={1} />
        ))}
        <circle ref={dot} cx={pts[0][0] * 60 + 40} cy={pts[0][1] * 60 + 64} r={4.2} fill="#d4ff3a" stroke="#0a0b0d" strokeWidth={1.4} />
      </svg>
      <div className="mt-1 flex flex-col">
        {SCENES.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className={cn("sr-only focus:not-sr-only focus:rounded focus:px-1 focus:text-xs", scene.index === i && "font-semibold")}>
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
