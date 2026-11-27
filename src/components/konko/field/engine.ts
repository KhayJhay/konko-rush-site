/**
 * KonKo Rush particle field.
 * One WebGL2 canvas, ~96k particles, re-forming for every section of the page.
 * GPGPU spring, wake map and capsule streaks adapted from "Sculpture Hero"
 * by Guglielmo Giannattasio (see components/ui/liquid-sculpture-hero.tsx).
 */

import { bus, type Theme } from "./bus"
import { buildCloud, FORMS, trackPath, type FormId, type FormSpec } from "./forms"
import { applyScene, sceneElements } from "./scenes"
import { FLOW_FS, PART_FS, PART_VS, QUAD_VS, SIM_FS } from "./shaders"

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }
type RGB = [number, number, number]
interface FormU {
  id: FormId
  spec: FormSpec
  place: [number, number, number, number]
  cam: [number, number, number, number]
  p: [number, number, number, number]
}

const TEX_W = 512
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

const PALETTE: Record<Theme, { cool: RGB; ink: RGB; warm: RGB; hot: RGB }> = {
  night: { cool: hex("#4fc3f7"), ink: hex("#f4f4f2"), warm: hex("#d4ff3a"), hot: hex("#ff3b24") },
  day: { cool: hex("#2a7fa6"), ink: hex("#0a0b0d"), warm: hex("#6f8f00"), hot: hex("#e0301c") },
  brand: { cool: hex("#55700a"), ink: hex("#0a0b0d"), warm: hex("#f4f4f2"), hot: hex("#ff3b24") },
}

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): Prog {
  const make = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error("Shader: " + gl.getShaderInfoLog(sh))
    return sh
  }
  const p = gl.createProgram()!
  gl.attachShader(p, make(gl.VERTEX_SHADER, vs))
  gl.attachShader(p, make(gl.FRAGMENT_SHADER, fs))
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("Link: " + gl.getProgramInfoLog(p))
  const u: Prog["u"] = {}
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i)
    if (info) u[info.name] = gl.getUniformLocation(p, info.name)
  }
  return { p, u }
}

export class FieldEngine {
  private gl: WebGL2RenderingContext
  private N: number
  private texH: number
  private stateFmt: { internal: number; type: number }
  private pFlow: Prog
  private pSim: Prog
  private pPart: Prog
  private vao: WebGLVertexArrayObject
  private seedTex: WebGLTexture
  private clouds = new Map<string, WebGLTexture>()
  private state: { tex: WebGLTexture; fb: WebGLFramebuffer }[] = []
  private si = 0
  private flow: { tex: WebGLTexture; fb: WebGLFramebuffer }[] = []
  private fi = 0
  private flowH = 144

  private w = 1
  private h = 1
  private dpr = 1
  private raf = 0
  private last = 0
  private time = 0
  private age = 0
  private started = false
  private cur: FormU | null = null
  private prev: FormU | null = null
  private pal = structuredClone(PALETTE.night)
  private theme: Theme = "night"
  private drive = 0
  private scrollV = 0
  private lastY = 0
  private audio = 0
  private fade = 0
  private racers = new Float32Array(24)
  private hidden = false

  private target = { x: -9999, y: -9999 }
  private mouse = { x: -9999, y: -9999 }
  private pm = { x: -9999, y: -9999 }
  private mv = { x: 0, y: 0 }
  private par = { x: 0, y: 0 }
  private presence = 0
  private presenceT = 0
  private touchOff = 0
  private queue: string[] = []
  private dead = false

  constructor(
    private canvas: HTMLCanvasElement,
    private reduced: boolean
  ) {
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, depth: false, premultipliedAlpha: true, powerPreference: "high-performance" })
    if (!gl) throw new Error("WebGL2 unavailable")
    this.gl = gl
    const full = gl.getExtension("EXT_color_buffer_float")
    const half = full ? null : gl.getExtension("EXT_color_buffer_half_float")
    if (!full && !half) throw new Error("No float render targets")
    this.stateFmt = full ? { internal: gl.RGBA32F, type: gl.FLOAT } : { internal: gl.RGBA16F, type: gl.HALF_FLOAT }
    const nav = navigator as Navigator & { deviceMemory?: number }
    const low = window.matchMedia("(pointer: coarse)").matches || (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4
    this.texH = low ? 88 : 256
    this.N = TEX_W * this.texH

    this.pFlow = compile(gl, QUAD_VS, FLOW_FS)
    this.pSim = compile(gl, QUAD_VS, SIM_FS)
    this.pPart = compile(gl, PART_VS, PART_FS)

    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)
    const quad = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const seeds = new Float32Array(this.N * 4)
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random()
    this.seedTex = this.tex(gl.RGBA32F, TEX_W, this.texH, gl.FLOAT, seeds, gl.NEAREST)
    for (let i = 0; i < 2; i++) {
      this.state.push(this.target2d(this.stateFmt.internal, TEX_W, this.texH, this.stateFmt.type, gl.NEAREST))
      this.flow.push(this.target2d(gl.RGBA8, 256, this.flowH, gl.UNSIGNED_BYTE, gl.LINEAR))
    }
    for (const f of this.flow) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, f.fb)
      gl.clearColor(128 / 255, 128 / 255, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  /* ── GL helpers ─────────────────────────────────────────────────────── */

  private tex(internal: number, w: number, h: number, type: number, data: ArrayBufferView | null, filter: number) {
    const gl = this.gl
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, type, data)
    for (const [k, v] of [
      [gl.TEXTURE_MIN_FILTER, filter],
      [gl.TEXTURE_MAG_FILTER, filter],
      [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
      [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
    ])
      gl.texParameteri(gl.TEXTURE_2D, k, v)
    return t
  }
  private target2d(internal: number, w: number, h: number, type: number, filter: number) {
    const gl = this.gl
    const tex = this.tex(internal, w, h, type, null, filter)
    const fb = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("FBO incomplete")
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return { tex, fb }
  }
  private cloud(name: string) {
    let t = this.clouds.get(name)
    if (!t) {
      t = this.tex(this.gl.RGBA32F, TEX_W, this.texH, this.gl.FLOAT, buildCloud(name, this.N), this.gl.NEAREST)
      this.clouds.set(name, t)
    }
    return t
  }
  private bind(unit: number, t: WebGLTexture, loc: WebGLUniformLocation | null | undefined) {
    if (!loc) return
    const gl = this.gl
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.uniform1i(loc, unit)
  }
  private formUniforms(P: Prog, name: "uA" | "uB", f: FormU) {
    const gl = this.gl
    gl.uniform1i(P.u[`${name}.kind`] ?? null, f.spec.kind)
    gl.uniform4fv(P.u[`${name}.place`] ?? null, f.place)
    gl.uniform4fv(P.u[`${name}.cam`] ?? null, f.cam)
    gl.uniform4fv(P.u[`${name}.p`] ?? null, f.p)
    gl.uniform1f(P.u[`${name}.size`] ?? null, f.spec.size)
  }
  private shared(P: Prog) {
    const gl = this.gl
    gl.uniform2f(P.u.uView, this.w, this.h)
    gl.uniform1f(P.u.uTime, this.time)
    gl.uniform1f(P.u.uAudio, this.audio)
    gl.uniform1f(P.u.uDrive, this.drive)
    gl.uniform1f(P.u.uArrive, bus.arrive)
    gl.uniform1f(P.u.uJoined, bus.joined)
    gl.uniform4fv(P.u["uRacer[0]"] ?? null, this.racers)
  }

  /* ── lifecycle ──────────────────────────────────────────────────────── */

  start() {
    this.resize()
    this.lastY = window.scrollY
    window.addEventListener("resize", this.resize)
    window.addEventListener("pointermove", this.onMove, { passive: true })
    window.addEventListener("pointerdown", this.onMove, { passive: true })
    window.addEventListener("pointerup", this.onUp, { passive: true })
    document.documentElement.addEventListener("pointerleave", this.onUp)
    document.addEventListener("visibilitychange", this.onVis)
    this.canvas.addEventListener("webglcontextlost", this.onLost)
    this.queue = ["coast", "compound", "podium", "trophy", "item-cap", "item-shield", "item-turbo", "item-repair", "item-shock", "item-deflect", "controller", "flag"]
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }
  destroy() {
    this.dead = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener("resize", this.resize)
    window.removeEventListener("pointermove", this.onMove)
    window.removeEventListener("pointerdown", this.onMove)
    window.removeEventListener("pointerup", this.onUp)
    document.documentElement.removeEventListener("pointerleave", this.onUp)
    document.removeEventListener("visibilitychange", this.onVis)
    this.canvas.removeEventListener("webglcontextlost", this.onLost)
    this.gl.getExtension("WEBGL_lose_context")?.loseContext()
  }
  private onLost = (e: Event) => {
    e.preventDefault()
    this.dead = true
    cancelAnimationFrame(this.raf)
    this.canvas.style.opacity = "0"
  }
  private onVis = () => {
    cancelAnimationFrame(this.raf)
    if (!document.hidden && !this.dead) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.frame)
    }
  }
  private resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth
    const h = this.canvas.clientHeight || window.innerHeight
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (w * h * dpr * dpr > 4.5e6) dpr = Math.max(1, Math.sqrt(4.5e6 / (w * h)))
    this.w = w
    this.h = h
    this.dpr = dpr
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
  }
  private onMove = (e: PointerEvent) => {
    if (this.reduced) return
    if (this.mouse.x < -9000) {
      this.mouse = { x: e.clientX, y: e.clientY }
      this.pm = { ...this.mouse }
    }
    this.target = { x: e.clientX, y: e.clientY }
    this.presenceT = 1
    this.touchOff = e.pointerType === "touch" ? performance.now() + 320 : 0
  }
  private onUp = () => {
    this.presenceT = 0
  }

  /* ── scenes ─────────────────────────────────────────────────────────── */

  private sceneEls: HTMLElement[] = []
  private veils = new Float32Array(12)
  private readVeils(el: HTMLElement) {
    this.veils.fill(0)
    let i = 0
    for (const v of el.querySelectorAll<HTMLElement>("[data-veil]")) {
      if (i > 2) break
      const r = v.getBoundingClientRect()
      if (r.bottom < 0 || r.top > this.h || getComputedStyle(v).visibility === "hidden") continue
      this.veils.set([r.left + r.width / 2, r.top + r.height / 2, r.width / 2, r.height / 2], i * 4)
      i++
    }
  }
  private scan = 0
  private progress(el: HTMLElement) {
    const r = el.getBoundingClientRect()
    return clamp(-r.top / Math.max(1, r.height - this.h), 0, 1)
  }
  private resolve(): FormU | null {
    if (this.scan++ % 30 === 0) this.sceneEls = sceneElements()
    if (!this.sceneEls.length) return null
    const { el, theme } = applyScene(this.sceneEls, this.h)
    this.theme = theme

    this.readVeils(el)
    const anchor = el.querySelector<HTMLElement>("[data-field]")
    if (!anchor) return this.cur
    if (anchor.dataset.field === "none") {
      this.hidden = true
      return this.cur
    }
    this.hidden = false
    const id = anchor.dataset.field as FormId
    const spec = FORMS[id]
    if (!spec) return this.cur
    const r = anchor.getBoundingClientRect()
    const scale = Math.min(r.width / 2 / spec.halfW, r.height / 2 / spec.halfH)
    let yaw = spec.yaw + Math.sin(this.time * 0.22) * spec.sway + this.par.x * 0.11
    let pitch = spec.pitch + this.par.y * 0.05
    const sp = this.progress(el)
    let p: FormU["p"] = [0, 0, 0, 0]
    switch (id) {
      case "car": {
        yaw = yaw + (-0.05 - spec.yaw) * ss(0.05, 0.7, sp)
        pitch = pitch + (0.06 - spec.pitch) * ss(0.05, 0.7, sp)
        p = [1, 1, 0.35, clamp(0.7 + Math.abs(this.scrollV) * 0.02, 0.6, 1)]
        break
      }
      case "carbuild":
        p = [clamp(sp * 1.25, 0, 1), 0, 0, 0]
        break
    }
    return {
      id,
      spec,
      place: [r.left + r.width / 2, r.top + r.height / 2, scale, spec.D],
      cam: [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)],
      p,
    }
  }

  /* ── frame ──────────────────────────────────────────────────────────── */

  private frame = (now: number) => {
    if (this.dead) return
    this.raf = requestAnimationFrame(this.frame)
    const ms = Math.min(100, now - this.last)
    this.last = now
    const dt = clamp(ms / 16.6667, 0.25, 3)
    const y = window.scrollY
    this.scrollV += ((y - this.lastY) / dt - this.scrollV) * 0.18
    this.lastY = y
    if (!this.reduced) this.time += ms / 1000
    this.drive += (this.reduced ? 0 : 0.011 * dt) + Math.max(0, this.scrollV) * 0.0011 * dt
    this.audio += (bus.audio - this.audio) * 0.18
    this.fade = this.hidden ? Math.max(0, this.fade - ms / 400) : Math.min(1, this.fade + ms / 900)

    const next = this.resolve()
    if (!next) return
    if (!this.started) {
      this.started = true
      this.cloud(next.spec.cloud)
      this.cur = next
      this.prev = next
      this.age = this.reduced ? 3 : 0
      if (!this.reduced) this.seedIntro()
    } else if (this.cur && next.id !== this.cur.id) {
      this.cloud(next.spec.cloud)
      this.prev = this.cur
      this.cur = next
      if (this.reduced) this.age = 3
      else {
        this.simulate(0, true)
        this.age = 0
      }
    } else this.cur = next
    this.age += ms / 1000

    if (this.touchOff && now > this.touchOff) {
      this.presenceT = 0
      this.touchOff = 0
    }
    const ease = 1 - Math.pow(0.78, dt)
    this.mouse.x += (this.target.x - this.mouse.x) * ease
    this.mouse.y += (this.target.y - this.mouse.y) * ease
    const vx = (this.mouse.x - this.pm.x) / dt
    const vy = (this.mouse.y - this.pm.y) / dt
    this.pm = { ...this.mouse }
    this.mv.x += (clamp(vx, -60, 60) - this.mv.x) * 0.5
    this.mv.y += (clamp(vy, -60, 60) - this.mv.y) * 0.5
    this.presence += (this.presenceT - this.presence) * (1 - Math.pow(1 - (this.presenceT > this.presence ? 0.1 : 0.04), dt))
    if (this.target.x > -9000) {
      this.par.x += ((this.target.x / this.w - 0.5) * 2 - this.par.x) * 0.04
      this.par.y += ((this.target.y / this.h - 0.5) * 2 - this.par.y) * 0.04
    }

    const T = PALETTE[this.theme]
    const tint = this.cur?.spec.tint ? hex(this.cur.spec.tint) : null
    const k = 1 - Math.pow(0.92, dt)
    for (const key of ["cool", "ink", "warm", "hot"] as const) {
      const goal = key === "warm" && tint ? tint : T[key]
      for (let i = 0; i < 3; i++) this.pal[key][i] += (goal[i] - this.pal[key][i]) * k
    }
    if (this.cur && this.cur.spec.kind === 18) this.placeRacers(this.cur.id)

    if (!this.reduced) {
      this.stepFlow(dt)
      this.simulate(dt, false)
    }
    this.draw()

    // build the remaining forms one per idle frame, after the intro has settled
    if (this.queue.length && this.time > 1.6 && this.age > 1.2) {
      const name = this.queue.shift()!
      if (!this.clouds.has(name)) this.cloud(name)
    }
  }

  /** six cars on the circuit: you lead the scrubbed lap, the rest jostle around you */
  private placeRacers(id: string) {
    const P = trackPath(id)
    const M = P.length
    for (let i = 0; i < 6; i++) {
      const gap = i === 0 ? 0 : -0.018 * i + 0.006 * Math.sin(this.time * (0.6 + i * 0.13) + i * 2.1)
      const f = ((((bus.lap + gap) % 1) + 1) % 1) * M
      const j = Math.floor(f), u = f - j
      const a = P[j % M], b = P[(j + 1) % M]
      this.racers.set([a[0] + (b[0] - a[0]) * u, 0, a[1] + (b[1] - a[1]) * u, 0], i * 4)
    }
  }

  private seedIntro() {
    const gl = this.gl
    const st = new Float32Array(this.N * 4)
    for (let i = 0; i < this.N; i++) {
      // arrives as a long gust from the left
      st[i * 4] = -this.w * (0.25 + Math.random() * 1.1)
      st[i * 4 + 1] = (Math.random() - 0.5) * this.h * 0.5
      st[i * 4 + 2] = 14 + Math.random() * 20
    }
    gl.bindTexture(gl.TEXTURE_2D, this.state[this.si].tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, this.stateFmt.internal, TEX_W, this.texH, 0, gl.RGBA, gl.FLOAT, st)
  }

  private stepFlow(dt: number) {
    const gl = this.gl
    const P = this.pFlow
    const dst = 1 - this.fi
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.flow[dst].fb)
    gl.viewport(0, 0, 256, this.flowH)
    gl.disable(gl.BLEND)
    gl.useProgram(P.p)
    gl.bindVertexArray(this.vao)
    this.bind(0, this.flow[this.fi].tex, P.u.uPrev)
    gl.uniform2f(P.u.uTexel, 1 / 256, 1 / this.flowH)
    gl.uniform2f(P.u.uMouse, this.mouse.x / this.w, this.mouse.y / this.h)
    gl.uniform2f(P.u.uVel, clamp(this.mv.x / 40, -1, 1), clamp(this.mv.y / 40, -1, 1))
    gl.uniform2f(P.u.uSize, this.w, this.h)
    gl.uniform1f(P.u.uRadius, this.radius())
    gl.uniform1f(P.u.uPresence, this.presence)
    gl.uniform1f(P.u.uDecay, Math.pow(0.968, dt))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    this.fi = dst
  }
  private radius() {
    return clamp(this.w * 0.085, 60, 130)
  }

  private simulate(dt: number, rebase: boolean) {
    if (!this.cur || !this.prev) return
    const gl = this.gl
    const P = this.pSim
    const dst = 1 - this.si
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.state[dst].fb)
    gl.viewport(0, 0, TEX_W, this.texH)
    gl.disable(gl.BLEND)
    gl.useProgram(P.p)
    gl.bindVertexArray(this.vao)
    this.bind(0, this.state[this.si].tex, P.u.uState)
    this.bind(1, this.seedTex, P.u.uSeed)
    this.bind(2, this.cloud(this.prev.spec.cloud), P.u.uTexA)
    this.bind(3, this.cloud(this.cur.spec.cloud), P.u.uTexB)
    this.bind(4, this.flow[this.fi].tex, P.u.uFlow)
    this.formUniforms(P, "uA", this.prev)
    this.formUniforms(P, "uB", this.cur)
    this.shared(P)
    gl.uniform1i(P.u.uRebase, rebase ? 1 : 0)
    gl.uniform2f(P.u.uMouse, this.mouse.x, this.mouse.y)
    gl.uniform1f(P.u.uRadius, this.radius())
    gl.uniform1f(P.u.uPresence, this.presence)
    gl.uniform1f(P.u.uDt, dt)
    gl.uniform1f(P.u.uAge, this.age)
    gl.uniform1f(P.u.uGust, this.cur.id === "car" ? 1 : 0.25)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    this.si = dst
  }

  private draw() {
    if (!this.cur || !this.prev) return
    const gl = this.gl
    const P = this.pPart
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.useProgram(P.p)
    gl.bindVertexArray(this.vao)
    this.bind(0, this.state[this.si].tex, P.u.uState)
    this.bind(1, this.seedTex, P.u.uSeed)
    this.bind(2, this.cloud(this.prev.spec.cloud), P.u.uTexA)
    this.bind(3, this.cloud(this.cur.spec.cloud), P.u.uTexB)
    this.formUniforms(P, "uA", this.prev)
    this.formUniforms(P, "uB", this.cur)
    this.shared(P)
    gl.uniform1i(P.u.uTexW, TEX_W)
    gl.uniform1f(P.u.uAge, this.age)
    gl.uniform1f(P.u.uFade, this.fade)
    gl.uniform1f(P.u.uDpr, this.dpr)
    const base = this.texH < 100 ? 1.5 : 1.28
    gl.uniform1f(P.u.uDot, clamp((this.cur.place[2] / 400) * base, 0.95, 1.9) * (this.theme === "night" ? 1 : 1.1))
    gl.uniform4fv(P.u["uVeil[0]"] ?? null, this.veils)
    gl.uniform3fv(P.u.uCool, this.pal.cool)
    gl.uniform3fv(P.u.uInk, this.pal.ink)
    gl.uniform3fv(P.u.uWarm, this.pal.warm)
    gl.uniform3fv(P.u.uHot, this.pal.hot)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.N)
    gl.disable(gl.BLEND)
  }
}
