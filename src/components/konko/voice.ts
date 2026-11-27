"use client"

import { useSyncExternalStore } from "react"

import { bus } from "./field/bus"

/**
 * Reads the page's sample records aloud with the visitor's own system voice
 * (Web Speech API). This narrates the page; it is not a game feature.
 * Nothing is sent anywhere and no key is needed. To use ElevenLabs voices instead,
 * replace `speakOne` with their text-to-speech endpoint and character timestamps.
 * If the browser has no voice, the lines play silently at reading pace.
 */
export interface Line {
  who: "record" | "action"
  text: string
  at?: string
}
export interface VoiceState {
  id: string | null
  line: number
  word: number
}

const IDLE: VoiceState = { id: null, line: -1, word: -1 }
let state: VoiceState = IDLE
const subs = new Set<() => void>()
const set = (s: VoiceState) => {
  state = s
  subs.forEach((f) => f())
}
export const useVoice = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => state,
    () => IDLE
  )

let run = 0
let env = 0
let raf = 0
function pump() {
  env *= 0.945
  const t = performance.now()
  bus.audio = Math.min(1, env * (0.72 + 0.28 * Math.sin(t * 0.021) * Math.sin(t * 0.0077)))
  if (state.id || env > 0.01) raf = requestAnimationFrame(pump)
  else {
    bus.audio = 0
    raf = 0
  }
}
const kick = (v = 1) => {
  env = Math.max(env, v)
  if (!raf) raf = requestAnimationFrame(pump)
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function silent(id: string, line: number, text: string, my: number) {
  const words = text.split(/\s+/)
  for (let w = 0; w < words.length; w++) {
    if (my !== run) return
    set({ id, line, word: w })
    kick(0.6 + 0.4 * Math.abs(Math.sin(w * 2.3)))
    await wait(150 + words[w].length * 26)
  }
}

function speakOne(id: string, line: number, l: Line, my: number): Promise<void> {
  return new Promise((resolve) => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined
    const voices = synth?.getVoices().filter((v) => v.lang.startsWith("en")) ?? []
    if (!synth || !voices.length) return void silent(id, line, l.text, my).then(resolve)

    const u = new SpeechSynthesisUtterance(l.text)
    const named = (re: RegExp) => voices.find((v) => re.test(v.name))
    const van = named(/Samantha|Google UK English Female|Serena|Karen|Moira|Aria|Jenny/i) ?? voices[0]
    const person = named(/Daniel|Google UK English Male|Oliver|Rishi|Guy|Ryan/i) ?? voices.find((v) => v !== van) ?? van
    u.voice = l.who === "record" ? van : person
    u.rate = l.who === "record" ? 1 : 1.04
    u.pitch = l.who === "record" ? 1 : 0.95
    let started = false
    let done = false
    const end = () => {
      if (done) return
      done = true
      resolve()
    }
    u.onstart = () => {
      started = true
      set({ id, line, word: 0 })
      kick(0.9)
    }
    u.onboundary = (e) => {
      if (my !== run || e.name === "sentence") return
      set({ id, line, word: l.text.slice(0, e.charIndex).split(/\s+/).filter(Boolean).length })
      kick(0.7 + Math.random() * 0.3)
    }
    u.onend = end
    u.onerror = () => {
      if (!started && my === run) silent(id, line, l.text, my).then(end)
      else end()
    }
    synth.speak(u)
    setTimeout(() => {
      if (started || done || my !== run) return
      synth.cancel()
      silent(id, line, l.text, my).then(end)
    }, 1200)
  })
}

export function stopVoice() {
  run++
  window.speechSynthesis?.cancel()
  set(IDLE)
}

export async function speak(id: string, lines: Line[]) {
  stopVoice()
  const my = ++run
  for (let i = 0; i < lines.length; i++) {
    if (my !== run) return
    set({ id, line: i, word: 0 })
    await speakOne(id, i, lines[i], my)
    if (my !== run) return
    await wait(380)
  }
  if (my === run) set(IDLE)
}

export const toggleVoice = (id: string, lines: Line[]) => (state.id === id ? stopVoice() : void speak(id, lines))
