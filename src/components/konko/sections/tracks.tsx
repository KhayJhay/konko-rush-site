"use client"

import { AnimatePresence, motion, useInView } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Matrix } from "@/components/ui/matrix"
import { ScrubBarContainer, ScrubBarThumb, ScrubBarTrack } from "@/components/ui/scrub-bar"
import { Waveform } from "@/components/ui/waveform"
import { PINNED, TRACKS } from "@/data/game"
import PATHS from "@/data/tracks.json"
import { matrixText } from "@/lib/matrix-text"

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

/** A lap you can scrub: dot-matrix distance and speed bars traced from the circuit's own corners. */
function Lap({ map, km }: { map: "compound" | "coast"; km: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.6 })
  const [lap, setLap] = useState(0.08)
  const [held, setHeld] = useState(false)
  const at = useRef(lap)
  const data = useMemo(() => trace(map), [map])
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
    <div ref={ref} className="mt-6 flex items-end gap-5">
      <div className="shrink-0 text-signal">
        <Matrix rows={7} cols={dist.cols} pattern={dist.frame} size={3.8} gap={1.4} ariaLabel={`${(lap * km).toFixed(1)} km into the lap`} palette={{ on: "var(--signal)", off: "var(--muted-foreground)" }} />
        <p className="hud mt-2 text-muted-foreground">km in</p>
      </div>
      <ScrubBarContainer duration={1} value={lap} onScrub={(v) => go(Math.min(0.999, v))} onScrubStart={() => setHeld(true)} className="relative block h-14 flex-1">
        <Waveform key={map} data={data} height={56} barWidth={3} barGap={3} barRadius={2} fadeEdges={false} barColor="#f4f4f2" className="pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - lap * 100}% 0 0)` }}>
          <Waveform key={`lit-${map}`} data={data} height={56} barWidth={3} barGap={3} barRadius={2} fadeEdges={false} barColor="#d4ff3a" />
        </div>
        <ScrubBarTrack
          tabIndex={0}
          aria-label="Your car's place on the lap. Bars show speed: tall on the straights, short through the corners."
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
  )
}

/** The game's own "Choose a circuit" screen: seven cards, A / D to change. */
export function Tracks() {
  const ref = useRef<HTMLElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.45 })
  const [i, setI] = useState(0)
  const t = TRACKS[i]

  const pick = useCallback((k: number, focus = false) => {
    const n = (k + TRACKS.length) % TRACKS.length
    setI(n)
    const el = strip.current?.children[n] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" })
    if (focus) el?.focus()
  }, [])

  useEffect(() => {
    bus.pin = t.lonlat ? PINNED.indexOf(t) : -1
  }, [t])

  // A / D change circuit while the section is on screen, as in the game
  useEffect(() => {
    if (!inView) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.closest("input, textarea, select")) return
      const k = e.key.toLowerCase()
      if (k === "a" || k === "d") pick(i + (k === "d" ? 1 : -1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [inView, i, pick])

  return (
    <section ref={ref} id="tracks" data-scene="tracks" data-label="Circuits" data-theme="night" className="relative flex min-h-svh flex-col overflow-clip">
      <div data-field={t.map ?? "ghana"} aria-hidden="true" className="max-lg:order-2 max-lg:h-[42svh] lg:absolute lg:top-[9svh] lg:right-[3vw] lg:bottom-[33svh] lg:left-[47vw]" />

      <div className="gutter relative z-10 pt-24 max-lg:order-1 lg:w-[50%] lg:pt-28">
        <div data-veil>
          <h2 className="display-lg">Seven circuits</h2>
          <p className="mt-4 max-w-[30rem] text-[1.0625rem] leading-[1.55] text-muted-foreground">
            From a family compound seen at toy height to the Accra coast, Kumasi and the Mole savannah.
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={t.id}
              role="tabpanel"
              id="circuit-panel"
              aria-labelledby={`circuit-${t.id}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 min-h-[11rem]"
            >
              <p className="hud flex items-center gap-2 text-muted-foreground">
                <span className="text-signal">{t.n}</span> {t.where}
                {t.isNew && <span className="bg-primary px-1.5 py-0.5 text-primary-foreground">New</span>}
              </p>
              <h3 className="mt-2 font-display text-[clamp(1.75rem,3vw,2.375rem)] leading-tight font-light tracking-[-0.025em]">{t.full ?? t.name}</h3>
              <p className="mt-2 max-w-[30rem] text-[0.9375rem] leading-normal text-muted-foreground">{t.body ?? t.place}</p>
              {t.meta && (
                <dl className="mt-4 flex gap-8">
                  {t.meta.map(([v, k]) => (
                    <div key={k} className="flex flex-col-reverse">
                      <dt className="hud mt-0.5 text-muted-foreground">{k}</dt>
                      <dd className="font-display text-2xl font-light">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {t.map && t.meta && <Lap map={t.map} km={parseFloat(t.meta[0][0])} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="gutter relative z-10 mt-auto pt-8 pb-28 max-lg:order-3">
        <p className="hud mb-3 text-muted-foreground" id="choose-circuit">
          Choose a circuit
        </p>
        <div ref={strip} role="tablist" aria-labelledby="choose-circuit" className="-mx-1 grid snap-x auto-cols-[minmax(9.5rem,1fr)] grid-flow-col gap-2.5 overflow-x-auto px-1 pt-1 pb-2 [scrollbar-width:none]">
          {TRACKS.map((c, k) => (
            <button
              key={c.id}
              id={`circuit-${c.id}`}
              type="button"
              role="tab"
              aria-selected={k === i}
              aria-controls="circuit-panel"
              tabIndex={k === i ? 0 : -1}
              onClick={() => pick(k)}
              onKeyDown={(e) => {
                const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
                if (!d) return
                e.preventDefault()
                pick(k + d, true)
              }}
              className="group cut snap-start cursor-pointer text-left outline-none transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 focus-visible:-translate-y-0.5 aria-selected:-translate-y-1"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/assets/img/circuits/${c.card}.jpg`} alt="" width={243} height={127} loading="lazy" className="aspect-[243/127] w-full object-cover opacity-60 transition-opacity group-hover:opacity-90 group-aria-selected:opacity-100" />
              <span className="flex items-center justify-between gap-2 bg-foreground/8 px-3 py-2.5 text-[0.8125rem] font-semibold tracking-[0.05em] uppercase transition-colors group-focus-visible:bg-foreground/20 group-aria-selected:bg-primary group-aria-selected:text-primary-foreground">
                <span className="truncate">{c.name}</span>
                {c.isNew && <span className="hud shrink-0 text-[0.625rem] text-signal group-aria-selected:text-primary-foreground">New</span>}
              </span>
            </button>
          ))}
        </div>
        <p className="hud mt-3 flex gap-5 text-muted-foreground max-lg:hidden" aria-hidden="true">
          <span>
            <kbd className="mr-2 rounded-md border border-b-[3px] border-foreground/25 bg-background px-2 py-0.5 text-foreground">A / D</kbd>Change
          </span>
          <span>
            <kbd className="mr-2 rounded-md border border-b-[3px] border-foreground/25 bg-background px-2 py-0.5 text-foreground">Click</kbd>Select
          </span>
        </p>
      </div>
    </section>
  )
}
