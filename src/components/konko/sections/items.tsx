"use client"

import { Dices } from "lucide-react"
import { useInView } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { ShimmeringText } from "@/components/ui/shimmering-text"
import { ITEMS } from "@/data/game"
import { cn } from "@/lib/utils"

import type { FormId } from "../field/forms"

/** Six items, and an item box you can roll. */
export function Items() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const [i, setI] = useState(0)
  const [rolling, setRolling] = useState(false)
  const [touched, setTouched] = useState(false)
  const it = ITEMS[i]

  useEffect(() => {
    if (!inView || touched || rolling || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setTimeout(() => setI((k) => (k + 1) % ITEMS.length), 3800)
    return () => clearTimeout(t)
  }, [inView, touched, rolling, i])

  const roll = () => {
    setTouched(true)
    setRolling(true)
    const land = Math.floor(Math.random() * ITEMS.length)
    const spins = 14 + land
    let k = 0
    const next = () => {
      setI((v) => (v + 1) % ITEMS.length)
      if (++k < spins) setTimeout(next, 45 + k * k * 1.6)
      else setRolling(false)
    }
    next()
  }

  return (
    <section ref={ref} id="items" data-scene="items" data-label="Items" data-theme="night" className="relative">
      <div className="gutter grid min-h-svh grid-cols-[minmax(0,1fr)] items-center gap-x-12 gap-y-8 pt-24 pb-28 lg:grid-cols-2 lg:pt-28">
        <div data-veil className="relative z-10">
          <h2 className="display-lg">Six items</h2>
          <p className="mt-4 max-w-[30rem] text-[1.0625rem] leading-[1.55] text-muted-foreground">
            Grab them from the pickup rows and use them well. Each one can turn a race, and every one can be turned back on you.
          </p>
          <ul className="mt-8 grid max-w-[32rem] grid-cols-2 gap-2 sm:grid-cols-3" role="listbox" aria-label="Items">
            {ITEMS.map((x, k) => (
              <li key={x.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={k === i}
                  onClick={() => {
                    setTouched(true)
                    setI(k)
                  }}
                  className={cn("cut flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors", k === i ? "bg-foreground/14" : "bg-foreground/5 hover:bg-foreground/10")}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-md" style={{ background: x.color }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/assets/img/${x.icon}.svg`} alt="" width={18} height={18} className="size-4.5 invert" />
                  </span>
                  {x.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6 min-h-[6.5rem] max-w-[30rem] border-t pt-4" aria-live="polite">
            <p className="font-display text-[1.75rem] font-light tracking-[-0.02em]" style={{ color: it.color }}>
              {rolling ? <ShimmeringText text="Rolling…" duration={0.9} repeatDelay={0} color={it.color} shimmerColor="#ffffff" /> : it.name}
            </p>
            <p className="mt-1.5 text-[0.9375rem] leading-normal text-muted-foreground">{rolling ? " " : it.body}</p>
          </div>
          <button type="button" onClick={roll} disabled={rolling} className="cut mt-4 inline-flex h-11 cursor-pointer items-center gap-2 bg-primary px-5 text-sm font-semibold tracking-[0.04em] text-primary-foreground uppercase disabled:opacity-60">
            <Dices className="size-4" /> Roll the item box
          </button>
        </div>
        <div data-field={`item-${it.id}` as FormId} aria-hidden="true" className="h-[48svh] lg:h-[70svh]" />
      </div>
    </section>
  )
}
