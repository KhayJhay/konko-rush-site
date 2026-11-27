"use client"

import { motion, useScroll, useTransform, type MotionValue } from "motion/react"
import { useRef } from "react"

import { Matrix } from "@/components/ui/matrix"
import { matrixText } from "@/lib/matrix-text"

const TEXT =
  "Every car is scratched printed tin, bent panels and bottle-cap wheels, built the way children in Ghana have built konko cars for generations. Races are short and rowdy: six cars, items flying, panels tearing away as cars take damage."

const STATS: [string, string][] = [
  ["8", "Cars to earn"],
  ["5", "Car tiers"],
  ["2", "Circuits"],
  ["6", "Items"],
]

function Word({ p, i, n, children }: { p: MotionValue<number>; i: number; n: number; children: string }) {
  const at = 0.05 + (i / n) * 0.62
  const opacity = useTransform(p, [at, at + 0.08], [0.22, 1])
  return <motion.span style={{ opacity }}>{children} </motion.span>
}

/** Scroll builds the car: tins, caps and a wing fly in from the bench as the words land. */
export function Workshop() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] })
  const words = TEXT.split(" ")
  return (
    <section ref={ref} id="about" data-scene="about" data-label="Workshop" data-theme="day" className="relative h-[250svh]">
      <div className="sticky top-0 flex h-svh flex-col overflow-clip lg:block">
        <div className="gutter relative z-10 pt-[12svh] lg:flex lg:h-full lg:w-[56%] lg:flex-col lg:justify-center lg:pt-0">
          <div data-veil>
            <h2 className="display-lg max-w-[11ch]">
              Built from <span className="text-signal italic">tins</span> and bottle caps.
            </h2>
            <p className="mt-6 max-w-[34rem] text-[clamp(1.0625rem,1.5vw,1.3125rem)] leading-[1.5]">
              {words.map((w, i) => (
                <Word key={i} p={p} i={i} n={words.length}>
                  {w}
                </Word>
              ))}
            </p>
            <dl className="mt-8 grid max-w-[34rem] grid-cols-4 gap-4 border-t pt-5">
              {STATS.map(([v, k]) => {
                const m = matrixText(v)
                return (
                  <div key={k}>
                    <dt className="sr-only">{k}</dt>
                    <dd>
                      <Matrix rows={7} cols={m.cols} pattern={m.frame} size={5} gap={1.6} ariaLabel={`${v} ${k}`} />
                      <span className="hud mt-2.5 block text-muted-foreground">{k}</span>
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </div>
        <div data-field="carbuild" aria-hidden="true" className="min-h-0 flex-1 max-lg:mb-20 lg:absolute lg:inset-y-[14svh] lg:right-[1vw] lg:left-[52vw]" />
      </div>
    </section>
  )
}
