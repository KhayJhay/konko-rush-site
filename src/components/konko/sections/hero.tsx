"use client"

import { motion, useScroll, useTransform } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Matrix, type Frame } from "@/components/ui/matrix"
import { VoiceButton } from "@/components/ui/voice-button"
import { matrixText } from "@/lib/matrix-text"

import { GetButtons } from "../get-buttons"

import { speak, stopVoice, useVoice, type Line } from "../voice"

const CALL: Line[] = [
  { who: "record", text: "Racers, take your marks." },
  { who: "record", text: "Three." },
  { who: "record", text: "Two." },
  { who: "record", text: "One." },
  { who: "record", text: "Go!" },
]

/** five start lights on a 7 by 29 dot grid; n lit from the left */
function lights(n: number): Frame {
  const disc = [[0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [0, 1, 1, 1, 0]]
  return Array.from({ length: 7 }, (_, y) =>
    Array.from({ length: 29 }, (_, x) => {
      const i = Math.floor(x / 6), cx = x % 6
      if (cx > 4 || y < 1 || y > 5) return 0
      return disc[y - 1][cx] ? (i < n ? 1 : 0.12) : 0
    })
  )
}
const GO = (() => {
  const g = matrixText("GO!").frame
  const pad = Math.floor((29 - g[0].length) / 2)
  return g.map((r) => [...Array(pad).fill(0), ...r, ...Array(29 - pad - r.length).fill(0)])
})()

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] })
  const copyO = useTransform(p, [0, 0.24], [1, 0])
  const copyY = useTransform(p, [0, 0.24], [0, -48])
  const copyV = useTransform(p, (v) => (v > 0.26 ? "hidden" : "visible"))
  const beatO = useTransform(p, [0.42, 0.58, 0.9, 1], [0, 1, 1, 0])
  const beatY = useTransform(p, [0.42, 0.58], [28, 0])
  const beatV = useTransform(p, (v) => (v > 0.4 ? "visible" : "hidden"))
  const carP = useTransform(p, [0.12, 0.6], [0, 1])
  const voice = useVoice()
  const on = voice.id === "start"

  // lights: 0..5 lit, 6 = GO
  const [n, setN] = useState(0)
  const timer = useRef<number[]>([])
  const run = useCallback((withVoice: boolean) => {
    timer.current.forEach(clearTimeout)
    const step = withVoice ? 900 : 620
    timer.current = [0, 1, 2, 3, 4, 5, 6].map((k) => window.setTimeout(() => setN(k), k ? (withVoice ? 900 : 400) + k * step : 0))
    if (withVoice) void speak("start", CALL)
  }, [])
  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) run(false)
    else timer.current = [window.setTimeout(() => setN(6), 0)]
    const t = timer.current
    return () => t.forEach(clearTimeout)
  }, [run])

  const go = n >= 6

  return (
    <section ref={ref} id="top" data-scene="top" data-label="Grid" data-theme="night" className="relative h-[210svh]">
      <div className="sticky top-0 h-svh overflow-clip">
        <motion.div
          style={{ "--p": carP } as React.CSSProperties}
          data-field="car"
          aria-hidden="true"
          className="absolute top-[47svh] right-[-24vw] bottom-[8svh] left-[-14vw] lg:top-[16svh] lg:right-[-3vw] lg:bottom-[10svh] lg:left-[37vw] lg:translate-x-[calc(var(--p)*-13vw)]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[7svh] h-px overflow-hidden opacity-40 max-lg:hidden">
          <div className="h-px w-[200%] animate-[speedlines_1.4s_linear_infinite] bg-[repeating-linear-gradient(90deg,var(--foreground)_0_60px,transparent_60px_160px)]" />
        </div>

        <motion.div style={{ opacity: copyO, y: copyY, visibility: copyV }} className="gutter relative flex h-full flex-col pt-[12svh] lg:justify-center lg:pt-0 lg:pb-[6svh]">
          <div data-veil className="w-fit max-w-[31rem]">
            <div className="flex items-center gap-4" aria-live="polite">
              <Matrix rows={7} cols={29} pattern={go ? GO : lights(n)} size={4.2} gap={1.4} ariaLabel={go ? "Go" : `${n} of 5 start lights on`} palette={{ on: go ? "#d4ff3a" : "#ff3b24", off: "#3a3e45" }} />
              <VoiceButton
                state={on ? "processing" : "idle"}
                label={on ? "Stop" : "Hear the start"}
                variant="ghost"
                size="sm"
                onPress={() => (on ? stopVoice() : run(true))}
                className="h-9 rounded-full px-3 text-[0.8125rem] text-muted-foreground hover:text-foreground"
                waveformClassName={on ? "h-4 w-12 border-0 bg-transparent" : "hidden"}
              />
            </div>
            <h1 className="mt-7 font-display text-[clamp(2.75rem,min(5.6vw,11svh),5.75rem)] leading-[0.98] font-light tracking-[-0.035em] max-sm:mt-5">
              Race the tin toy cars of <span className="text-signal italic">Ghana.</span>
            </h1>
            <p className="mt-6 text-[1.0625rem] leading-[1.55] text-muted-foreground max-sm:mt-4 max-sm:text-[0.9375rem]">
              Konko cars are built by hand from milk tins, sardine cans and bottle caps. In KonKo Rush they drift, boost, jump and fight for the line on seven circuits across Ghana.
            </p>
            <GetButtons className="mt-8 max-sm:mt-5" />
            <ul aria-label="Platforms" className="hud mt-6 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
              {["Free", "iPhone", "iPad", "Mac", "Windows", "Android soon"].map((x, i) => (
                <li key={x} className={i ? "before:mr-4 before:text-foreground/30 before:content-['/']" : ""}>
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div style={{ opacity: beatO, y: beatY, visibility: beatV }} className="gutter pointer-events-none absolute inset-x-0 top-[14svh]">
          <p data-veil className="w-fit font-display text-[clamp(2rem,min(4.4vw,8svh),4.25rem)] leading-[1.02] font-light tracking-[-0.03em]">
            Drift. Boost. Jump.
            <br />
            Fire. Dent. <span className="text-signal italic">Repeat.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
