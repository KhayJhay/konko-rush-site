"use client"

import { useInView } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Matrix } from "@/components/ui/matrix"
import { ScrubBarContainer, ScrubBarThumb, ScrubBarTrack } from "@/components/ui/scrub-bar"
import { Waveform } from "@/components/ui/waveform"
import { TRACKS } from "@/data/game"
import PATHS from "@/data/tracks.json"
import { matrixText } from "@/lib/matrix-text"
import { cn } from "@/lib/utils"

import { bus } from "../field/bus"

/** speed along the lap, from how hard each corner bends: straights high, hairpins low */
function trace(id: string) {
  const P = (PATHS as Record<string, number[][]>)[id]
  const M = P.length
  const ang = (i: number) => {
    const a = P[(i + M) % M], b = P[(i + 1 + M) % M]
    return Math.atan2(b[1] - a[1], b[0] - a[0])
  }
  const raw = P.map((_, i) => {
    let d = 0
    for (let k = -4; k <= 4; k++) {
      let x = ang(i + k + 1) - ang(i + k)
      x = Math.atan2(Math.sin(x), Math.cos(x))
      d += Math.abs(x)
    }
    return d
  })
  const max = Math.max(...raw)
  return Array.from({ length: 120 }, (_, i) => 0.18 + 0.8 * (1 - Math.min(1, raw[Math.floor((i / 120) * M)] / max) ** 0.6))
}

export function Tracks() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const [i, setI] = useState(0)
  const [lap, setLap] = useState(0.08)
  const [held, setHeld] = useState(false)
  const at = useRef(lap)
  const t = TRACKS[i]
  const km = parseFloat(t.meta[0][0])
  const data = useMemo(() => trace(t.id), [t.id])

  const go = useCallback((v: number) => {
    const x = ((v % 1) + 1) % 1
    at.current = x
    bus.lap = x
    setLap(x)
  }, [])

  useEffect(() => {
    if (!inView || held || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      go(at.current + ((now - last) / 1000) * 0.045)
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, held, go])

  const dist = matrixText((lap * km).toFixed(1))

  return (
    <section ref={ref} id="tracks" data-scene="tracks" data-label="Circuits" data-theme="night" className="relative flex min-h-svh flex-col overflow-clip">
      <div data-field={t.id} aria-hidden="true" className="max-lg:order-2 max-lg:h-[46svh] lg:absolute lg:inset-y-[10svh] lg:right-[3vw] lg:left-[46vw]" />

      <div className="gutter relative z-10 grid gap-x-10 gap-y-6 pt-24 max-lg:order-1 lg:w-[50%] lg:pt-28">
        <div data-veil>
          <h2 className="display-lg">The circuits</h2>
          <p className="mt-5 max-w-[30rem] text-[1.0625rem] leading-[1.55] text-muted-foreground">
            One road runs full size along the Accra coast. The other runs through a family compound, seen from the height of a toy.
          </p>
          <div role="tablist" aria-label="Circuit" className="mt-7 flex gap-1.5">
            {TRACKS.map((x, k) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={k === i}
                onClick={() => setI(k)}
                className={cn("cut h-10 cursor-pointer px-4 text-sm font-medium uppercase tracking-[0.04em] transition-colors", k === i ? "bg-primary text-primary-foreground" : "bg-foreground/8 text-muted-foreground hover:text-foreground")}
              >
                {x.where}
              </button>
            ))}
          </div>
          <div role="tabpanel" aria-label={t.name} className="mt-6">
            <h3 className="font-display text-[1.75rem] font-light tracking-[-0.02em]">{t.name}</h3>
            <p className="mt-2 max-w-[30rem] text-[0.9375rem] leading-normal text-muted-foreground">{t.body}</p>
            <dl className="mt-5 flex gap-8">
              {t.meta.map(([v, k]) => (
                <div key={k}>
                  <dd className="font-display text-2xl font-light">{v}</dd>
                  <dt className="hud mt-0.5 text-muted-foreground">{k}</dt>
                </div>
              ))}
            </dl>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/assets/img/${t.shot}.jpg`} alt={t.shotAlt} width={1400} height={788} loading="lazy" className="cut mt-6 aspect-video w-full max-w-[26rem] object-cover" />
          </div>
        </div>
      </div>

      <div className="gutter relative z-10 mt-auto pt-6 pb-28 max-lg:order-3">
        <div className="flex items-end gap-6">
          <div className="shrink-0 text-signal">
            <Matrix rows={7} cols={dist.cols} pattern={dist.frame} size={4.6} gap={1.6} ariaLabel={`${(lap * km).toFixed(1)} km into the lap`} palette={{ on: "var(--signal)", off: "var(--muted-foreground)" }} />
            <p className="hud mt-2 text-muted-foreground">km into the lap</p>
          </div>
          <ScrubBarContainer duration={1} value={lap} onScrub={(v) => go(Math.min(0.999, v))} onScrubStart={() => setHeld(true)} className="relative block h-20 flex-1">
            <Waveform key={t.id} data={data} height={80} barWidth={3} barGap={3} barRadius={2} fadeEdges={false} barColor="#f4f4f2" className="pointer-events-none absolute inset-0 opacity-30" />
            <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - lap * 100}% 0 0)` }}>
              <Waveform key={`lit-${t.id}`} data={data} height={80} barWidth={3} barGap={3} barRadius={2} fadeEdges={false} barColor="#d4ff3a" />
            </div>
            <ScrubBarTrack
              tabIndex={0}
              aria-label="Your car's place on the lap"
              aria-valuetext={`${(lap * km).toFixed(1)} of ${km} km`}
              onKeyDown={(e) => {
                const d = { ArrowRight: 0.01, ArrowUp: 0.01, ArrowLeft: -0.01, ArrowDown: -0.01 }[e.key]
                if (d) {
                  e.preventDefault()
                  setHeld(true)
                  go(at.current + d)
                }
              }}
              className="absolute inset-0 h-full cursor-ew-resize rounded-none bg-transparent"
            >
              <span aria-hidden="true" className="absolute inset-y-0 w-px bg-foreground" style={{ left: `${lap * 100}%` }} />
              <ScrubBarThumb className="size-4 border-4 border-background bg-signal" />
            </ScrubBarTrack>
          </ScrubBarContainer>
        </div>
        <p className="hud mt-3 text-muted-foreground">Bars show speed: tall on the straights, short through the corners. Drag to move your car.</p>
      </div>
    </section>
  )
}
