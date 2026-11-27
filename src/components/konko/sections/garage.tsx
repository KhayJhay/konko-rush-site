"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

import { Matrix } from "@/components/ui/matrix"
import { CARS, STAT_NAMES } from "@/data/game"
import { cn } from "@/lib/utils"

const TIERS = [0, 1, 2, 3, 4, 5]

/** A car-select screen: pick a car, read its dot-matrix stats, see what it takes to earn it. */
export function Garage() {
  const [tier, setTier] = useState(0)
  const list = CARS.filter((c) => !tier || c.tier === tier)
  const [pick, setPick] = useState(CARS[7].name)
  const car = list.find((c) => c.name === pick) ?? list[0]
  const idx = list.indexOf(car)
  const step = (d: number) => setPick(list[(idx + d + list.length) % list.length].name)

  return (
    <section id="garage" data-scene="garage" data-label="Garage" data-theme="night" className="relative">
      <div
        className="gutter grid min-h-svh grid-cols-[minmax(0,1fr)] items-center gap-x-12 gap-y-8 pt-24 pb-28 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:pt-28"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1)
          if (e.key === "ArrowLeft") step(-1)
        }}
      >
        <div className="relative">
          <div data-field="podium" aria-hidden="true" className="absolute inset-x-[-6%] top-[30%] bottom-[-26%]" />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={car.name}
              initial={{ opacity: 0, x: 60, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -60, filter: "blur(8px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/assets/img/${car.img}.jpg`} alt={`${car.name}, a handmade tin toy car`} width={640} height={360} className="cut aspect-video w-full object-cover" />
              <span className="hud absolute top-3 left-5 bg-primary px-2 py-1 text-primary-foreground">Tier {car.tier}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div data-veil className="relative z-10">
          <h2 className="display-lg">The cars</h2>
          <p className="mt-4 max-w-[30rem] text-[0.9375rem] leading-normal text-muted-foreground">
            Start with two. Race, collect scrap and win Cups to unlock the rest. No car can be bought with real money, so the Tin Formula in your garage means you earned it.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <button type="button" onClick={() => step(-1)} aria-label="Previous car" className="grid size-10 cursor-pointer place-items-center rounded-full bg-foreground/10 hover:bg-foreground/20">
              <ChevronLeft className="size-4" />
            </button>
            <p className="min-w-0 flex-1 font-display text-[1.875rem] leading-tight font-light tracking-[-0.02em]" aria-live="polite">
              {car.name}
            </p>
            <button type="button" onClick={() => step(1)} aria-label="Next car" className="grid size-10 cursor-pointer place-items-center rounded-full bg-foreground/10 hover:bg-foreground/20">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <p className="mt-2 max-w-[30rem] text-[0.9375rem] leading-normal">{car.blurb}</p>

          <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-4 text-signal">
            {STAT_NAMES.map((n, i) => (
              <div key={n}>
                <dd>
                  <Matrix rows={8} cols={3} mode="vu" levels={[car.stats[i] / 100, car.stats[i] / 100, car.stats[i] / 100]} size={9} gap={2.4} ariaLabel={`${n} ${Math.round(car.stats[i] / 10)} of 10`} palette={{ on: "var(--signal)", off: "var(--muted-foreground)" }} />
                </dd>
                <dt className="hud mt-2 text-muted-foreground">{n}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-5 border-t pt-4 text-[0.9375rem]">
            <span className="hud mr-3 text-muted-foreground">Unlock</span>
            {car.unlock}
          </p>

          <div role="group" aria-label="Filter by tier" className="mt-6 flex flex-wrap gap-1.5">
            {TIERS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tier === t}
                onClick={() => setTier(t)}
                className={cn("cut h-9 cursor-pointer px-3.5 text-[0.8125rem] font-medium uppercase tracking-[0.04em] transition-colors", tier === t ? "bg-primary text-primary-foreground" : "bg-foreground/8 text-muted-foreground hover:text-foreground")}
              >
                {t ? `Tier ${t}` : "All"}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="listbox" aria-label="Cars">
            {list.map((c) => (
              <button
                key={c.name}
                type="button"
                role="option"
                aria-selected={c === car}
                onClick={() => setPick(c.name)}
                className={cn("cut w-24 shrink-0 cursor-pointer overflow-hidden ring-2 ring-transparent transition-opacity", c === car ? "opacity-100" : "opacity-45 hover:opacity-80")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/img/${c.img}.jpg`} alt={c.name} width={640} height={360} loading="lazy" className="aspect-video w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
