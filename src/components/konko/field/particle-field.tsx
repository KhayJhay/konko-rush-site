"use client"

import { useEffect, useRef } from "react"

import { FieldEngine } from "./engine"
import { watchScenes } from "./scenes"

/** The fixed canvas behind the whole page. Sections claim it with data-scene and data-field. */
export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const host = ref.current?.parentElement
    if (!host) return
    let engine: FieldEngine | null = null
    let dead = false
    let unwatch: (() => void) | null = null
    // a fresh canvas per engine: a released WebGL context cannot be reused
    const canvas = document.createElement("canvas")
    canvas.className = "absolute inset-0 h-full w-full"
    host.appendChild(canvas)
    document.fonts.ready.then(() => {
      if (dead) return
      try {
        engine = new FieldEngine(canvas, window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        engine.start()
      } catch (e) {
        console.warn("[konko] particle field off:", e)
        canvas.remove()
        unwatch = watchScenes()
      }
    })
    return () => {
      dead = true
      engine?.destroy()
      unwatch?.()
      canvas.remove()
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh">
      <canvas ref={ref} className="hidden" />
    </div>
  )
}
