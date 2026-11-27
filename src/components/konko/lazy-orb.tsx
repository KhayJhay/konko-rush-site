"use client"

import dynamic from "next/dynamic"
import { useRef } from "react"
import { useInView } from "motion/react"

import { bus } from "./field/bus"
import { cn } from "@/lib/utils"

const Orb = dynamic(() => import("@/components/ui/orb").then((m) => m.Orb), { ssr: false })

let gl: boolean | undefined
/** three.js throws without WebGL, so check once before mounting an Orb. */
function hasWebGL() {
  if (gl === undefined) {
    try {
      const ctx = document.createElement("canvas").getContext("webgl2")
      gl = !!ctx
      ctx?.getExtension("WEBGL_lose_context")?.loseContext()
    } catch {
      gl = false
    }
  }
  return gl
}

/** An ElevenLabs Orb that only holds a WebGL context while it is on screen. */
export function LazyOrb({ colors, seed, talking, className }: { colors: [string, string]; seed: number; talking: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { margin: "120px" })
  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden rounded-full", className)}
      style={{ background: `radial-gradient(circle at 34% 28%, ${colors[1]}, ${colors[0]})` }}
    >
      {seen && hasWebGL() && (
        <Orb
          colors={colors}
          seed={seed}
          agentState={talking ? "talking" : null}
          volumeMode={talking ? "manual" : "auto"}
          getInputVolume={() => bus.audio * 0.5}
          getOutputVolume={() => 0.35 + bus.audio * 0.65}
          className="absolute inset-[-5%]"
        />
      )}
    </div>
  )
}
