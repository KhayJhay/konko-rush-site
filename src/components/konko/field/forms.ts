/**
 * Point clouds for every KonKo Rush form. Each particle is (x, y, z, group + tone):
 * the group tells the shader how it moves, the tone (0..1) picks its colour on the
 * cool (shield blue) > ink (tin white) > warm (lime) > hot (red) ramp.
 */
import TRACK_PATHS from "@/data/tracks.json"
import { ITEMS, PINNED } from "@/data/game"
import { GHANA_OUTLINE, toMap } from "@/data/ghana"

export type FormId =
  | "car" | "carbuild" | "coast" | "compound" | "ghana" | "podium" | "trophy" | "controller" | "flag"
  | "item-cap" | "item-shield" | "item-turbo" | "item-repair" | "item-shock" | "item-deflect"

export interface FormSpec {
  kind: number
  cloud: string
  yaw: number
  pitch: number
  D: number
  sway: number
  size: number
  halfW: number
  halfH: number
  /** replaces the warm colour while this form is on screen */
  tint?: string
}

const item = (id: string, color: string): FormSpec => ({ kind: 21, cloud: "item-" + id, yaw: -0.25, pitch: 0.1, D: 5, sway: 0.4, size: 1, halfW: 1.05, halfH: 1.05, tint: color })

export const FORMS: Record<FormId, FormSpec> = {
  car: { kind: 17, cloud: "car", yaw: -0.62, pitch: 0.16, D: 4.2, sway: 0.06, size: 1, halfW: 1.3, halfH: 0.62 },
  carbuild: { kind: 17, cloud: "car", yaw: -0.52, pitch: 0.42, D: 4.6, sway: 0.12, size: 1, halfW: 1.25, halfH: 0.8 },
  coast: { kind: 18, cloud: "coast", yaw: -0.2, pitch: 0.92, D: 5, sway: 0.1, size: 0.98, halfW: 0.95, halfH: 1.02 },
  compound: { kind: 18, cloud: "compound", yaw: -0.2, pitch: 0.92, D: 5, sway: 0.1, size: 0.98, halfW: 1.05, halfH: 1.02 },
  ghana: { kind: 24, cloud: "ghana", yaw: 0, pitch: 1.12, D: 5, sway: 0.06, size: 1, halfW: 0.78, halfH: 1.02 },
  podium: { kind: 19, cloud: "podium", yaw: 0, pitch: 0.3, D: 4.4, sway: 0.04, size: 1, halfW: 1.3, halfH: 0.9 },
  trophy: { kind: 20, cloud: "trophy", yaw: -0.3, pitch: 0.12, D: 5, sway: 0.5, size: 1, halfW: 0.95, halfH: 1.12 },
  controller: { kind: 22, cloud: "controller", yaw: -0.25, pitch: 0.55, D: 5, sway: 0.25, size: 1, halfW: 1.25, halfH: 0.9 },
  flag: { kind: 23, cloud: "flag", yaw: -0.4, pitch: 0.12, D: 4.6, sway: 0.08, size: 1, halfW: 1.2, halfH: 0.95 },
  "item-cap": item("cap", "#ff3b24"),
  "item-shield": item("shield", "#4fc3f7"),
  "item-turbo": item("turbo", "#ff8a1f"),
  "item-repair": item("repair", "#33ff7a"),
  "item-shock": item("shock", "#d4ff3a"),
  "item-deflect": item("deflect", "#b388ff"),
}

const INK = 0.4
const WARM = 0.8

/* ── helpers ─────────────────────────────────────────────────────────── */

let seed = 7
const reseed = (n: number) => (seed = n)
function R() {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const J = (a: number) => (R() - 0.5) * 2 * a
const G = () => (R() + R() + R() - 1.5) / 1.5
const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)]
type V2 = [number, number]
type V3 = [number, number, number]

class Cloud {
  data: Float32Array
  n = 0
  constructor(readonly cap: number) {
    this.data = new Float32Array(cap * 4)
  }
  put(x: number, y: number, z: number, g: number, tone = INK) {
    if (this.n >= this.cap) return
    const i = this.n++ * 4
    this.data[i] = x
    this.data[i + 1] = y
    this.data[i + 2] = z
    this.data[i + 3] = g + Math.min(0.999, Math.max(0, tone)) * 0.98
  }
  /** run fn share*cap times */
  many(share: number, fn: () => void) {
    const n = Math.round(share * this.cap)
    for (let i = 0; i < n; i++) fn()
  }
  seg(a: V3, b: V3, g: number, tone = INK, j = 0.004) {
    const t = R()
    this.put(a[0] + (b[0] - a[0]) * t + J(j), a[1] + (b[1] - a[1]) * t + J(j), a[2] + (b[2] - a[2]) * t + J(j), g, tone)
  }
  finish() {
    for (; this.n < this.cap; ) this.put(0, 0, 0, 511, INK)
    // loosely sort left to right, so a morph flows across the screen instead of fogging it
    const N = this.cap
    const key = new Float32Array(N)
    for (let i = 0; i < N; i++) key[i] = this.data[i * 4] + (R() - 0.5) * 1.5 + (this.data[i * 4 + 3] >= 511 ? (R() - 0.5) * 3 : 0)
    const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => key[a] - key[b])
    const out = new Float32Array(N * 4)
    for (let i = 0; i < N; i++) out.set(this.data.subarray(order[i] * 4, order[i] * 4 + 4), i * 4)
    return out
  }
}

/** lit pixels of a word, as points in [-.5,.5] x [-h,h] (aspect kept) */
function wordPoints(text: string, weight = 600): V2[] {
  const c = document.createElement("canvas")
  c.width = 900
  c.height = 240
  const x = c.getContext("2d", { willReadFrequently: true })
  if (!x) return [[0, 0]]
  const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-inter-tight") || "Helvetica, Arial"
  x.font = `${weight} 170px ${fam}, Helvetica, Arial, sans-serif`
  x.textAlign = "center"
  x.textBaseline = "middle"
  x.fillText(text, 450, 124)
  const w = Math.max(40, x.measureText(text).width)
  const d = x.getImageData(0, 0, 900, 240).data
  const out: V2[] = []
  for (let j = 0; j < 240; j += 2) for (let i = 0; i < 900; i += 2) if (d[(j * 900 + i) * 4 + 3] > 120) out.push([(i - 450) / w, -(j - 120) / w])
  return out.length ? out : [[0, 0]]
}


/** surface sampling biased towards the side the camera usually sees */
const VIEW: V3 = [0.47, 0.15, 0.87]
const facing = (n: V3) => {
  const d = n[0] * VIEW[0] + n[1] * VIEW[1] + n[2] * VIEW[2]
  return d > -0.25 || R() < 0.12
}
const norm = (v: V3): V3 => {
  const l = Math.hypot(...v) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}
const LIGHT = norm([0.4, 0.8, 0.45])
const lit = (n: V3) => Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])

/** a point on a tapered capsule between a and b */
function capPt(a: V3, b: V3, r0: number, r1: number): [V3, V3] | null {
  const t = R()
  const d = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]])
  const ref: V3 = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const u = norm([d[1] * ref[2] - d[2] * ref[1], d[2] * ref[0] - d[0] * ref[2], d[0] * ref[1] - d[1] * ref[0]])
  const v: V3 = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]]
  const ang = R() * Math.PI * 2
  const n: V3 = [u[0] * Math.cos(ang) + v[0] * Math.sin(ang), u[1] * Math.cos(ang) + v[1] * Math.sin(ang), u[2] * Math.cos(ang) + v[2] * Math.sin(ang)]
  if (!facing(n)) return null
  const r = r0 + (r1 - r0) * t
  return [[a[0] + (b[0] - a[0]) * t + n[0] * r, a[1] + (b[1] - a[1]) * t + n[1] * r, a[2] + (b[2] - a[2]) * t + n[2] * r], n]
}
/** a point on a box's surface, faces weighted by area */
function boxPt(c: V3, h: V3): [V3, V3] | null {
  const A = [h[1] * h[2], h[0] * h[2], h[0] * h[1]]
  const r = R() * (A[0] + A[1] + A[2])
  const ax = r < A[0] ? 0 : r < A[0] + A[1] ? 1 : 2
  const s = R() < 0.5 ? -1 : 1
  const n: V3 = [0, 0, 0]
  n[ax] = s
  if (!facing(n)) return null
  const p: V3 = [c[0] + J(h[0]), c[1] + J(h[1]), c[2] + J(h[2])]
  p[ax] = c[ax] + s * h[ax]
  return [p, n]
}

/** fill a share of the cloud from a sampler, retrying when it returns null */
function from(c: Cloud, share: number, fn: () => [V3, V3] | null, g: number, tone: (n: V3, p: V3) => number) {
  c.many(share, () => {
    for (let k = 0; k < 12; k++) {
      const s = fn()
      if (!s) continue
      return c.put(s[0][0], s[0][1], s[0][2], g, tone(s[1], s[0]))
    }
  })
}

/** road paint, asphalt, headlight beam, wind lines and lamp posts shared by every vehicle on the move */
function roadKit(c: Cloud, lampY: number, lampZ: number, streamLines = 96, slip = 0.1) {
  c.many(0.04, () => c.put(G(), R(), G(), 11, 0.66))
  c.many(0.028, () => {
    if (R() < 0.72) { const z = R() < 0.62 ? 0.8 : -0.8; const k = Math.floor(R() * 8); c.put(-4.4 + k * 1.1 + R() * 0.56, 0, z + J(0.022), 12, INK) }
    else c.put(J(4.4), 0, -2.0 + J(0.016), 12, INK)
  })
  c.many(0.034, () => c.put(J(4.4), 0, -2.1 + R() * 4.3, 15, 0.08))
  const lines: V2[] = Array.from({ length: streamLines }, () => [Math.pow(R(), 1.5), J(0.42)])
  c.many(slip, () => { const l = pick(lines); c.put(l[0] + J(0.006), R(), l[1] + J(0.006), 13, 0.12 + R() * 0.22) })
  c.many(0.016, () => {
    const x = -5 + Math.floor(R() * 4) * 2.5, u = R()
    if (u < 0.5) c.put(x + J(0.004), R() * 1.75, -2.35, 16, 0.08)
    else if (u < 0.72) c.put(x + J(0.005), 1.75 + J(0.006), -2.35 + R() * 0.4, 16, 0.15)
    else c.put(x + G() * 0.05, 1.74 + G() * 0.02, -1.95 + G() * 0.06, 16, WARM)
  })
  c.many(0.01, () => { const s = R() < 0.5 ? -1 : 1; c.put(0, lampY + G() * 0.04, s * lampZ, 9, 0.66) })
}


/* ── the tin formula, #63 ────────────────────────────────────────────── */

/** printed-tin patches: every panel shows a different label colour */
const patch = (x: number, y: number, z: number) => {
  const h = Math.abs(Math.sin(Math.floor(x * 7 + 3) * 12.9898 + Math.floor(y * 9 + 2) * 78.233 + Math.floor(z * 5) * 37.7) * 43758.5453) % 1
  return h < 0.3 ? 0.99 : h < 0.55 ? 0.82 : h < 0.75 ? 0.04 : 0.42
}

function car(N: number) {
  reseed(211)
  const c = new Cloud(N)
  const num = wordPoints("63", 800)
  const part = (share: number, fn: () => [V3, V3] | null, g: number, tone: (n: V3, p: V3) => number) => from(c, share, fn, g, tone)
  const tin = (n: V3, p: V3) => {
    const t = patch(p[0], p[1], p[2])
    return lit(n) < 0.25 && t > 0.5 ? t - 0.12 : t
  }
  // body: a sardine-tin monocoque, low nose, raised cockpit
  part(0.2, () => {
    const x = -0.62 + R() * 1.6
    const u = (x + 0.62) / 1.6
    const ry = 0.08 + 0.07 * Math.sin(Math.min(1, u * 1.25) * Math.PI) + (x > -0.15 && x < 0.3 ? 0.04 : 0)
    const rz = 0.11 + 0.08 * (1 - u) + 0.02
    const a = R() * Math.PI * 2
    const n: V3 = norm([0, Math.sin(a) / ry, Math.cos(a) / rz])
    if (!facing(n)) return null
    return [[x, 0.26 + Math.sin(a) * ry, Math.cos(a) * rz], n]
  }, 30, tin)
  // cockpit rim and the tin-can air intake behind it
  c.many(0.02, () => { const a = R() * Math.PI * 2; c.put(0.08 + Math.cos(a) * 0.13, 0.4 + J(0.006), Math.sin(a) * 0.08, 30, 0.4) })
  part(0.04, () => capPt([-0.05, 0.46, 0], [-0.42, 0.42, 0], 0.07, 0.065), 38, (n, p) => tin(n, p))
  c.many(0.012, () => { const a = R() * Math.PI * 2; c.put(-0.05 + J(0.005), 0.46 + Math.cos(a) * 0.07, Math.sin(a) * 0.07, 38, 0.4) })
  // side pods
  for (const s of [1, -1]) part(0.05, () => boxPt([-0.18, 0.22, s * 0.22], [0.26, 0.08, 0.07]), 31, tin)
  // front wing and nose plate
  part(0.035, () => boxPt([0.97, 0.1, 0], [0.08, 0.012, 0.44]), 32, tin)
  for (const s of [1, -1]) part(0.008, () => boxPt([0.97, 0.15, s * 0.44], [0.09, 0.05, 0.008]), 32, () => 0.99)
  // rear wing on struts
  part(0.05, () => boxPt([-0.84, 0.72, 0], [0.16, 0.018, 0.44]), 33, tin)
  for (const s of [1, -1]) part(0.012, () => boxPt([-0.84, 0.66, s * 0.44], [0.17, 0.08, 0.008]), 33, () => 0.82)
  for (const s of [0.2, -0.2]) part(0.012, () => capPt([-0.66, 0.32, s], [-0.82, 0.7, s], 0.018, 0.016), 33, () => 0.4)
  // the number, on both flanks
  c.many(0.035, () => { const p = pick(num); c.put(0.32 + p[0] * 0.34, 0.27 + p[1] * 0.34, 0.172, 39, 0.08) })
  c.many(0.02, () => { const a = R() * Math.PI * 2, q = Math.sqrt(R()) * 0.13; c.put(0.32 + Math.cos(a) * q * 1.1, 0.27 + Math.sin(a) * q, 0.165, 39, 0.82) })
  // bottle-cap wheels with cork axle stubs
  const capWheel = (x: number, r: number, z: number, g: number, share: number) => {
    c.many(share, () => {
      const u = R(), a = R() * Math.PI * 2
      if (u < 0.42) { const zz = z + J(0.07); c.put(x + Math.cos(a) * r, r + Math.sin(a) * r, zz, g, Math.floor((a / (Math.PI * 2)) * 21) % 2 ? 0.3 : 0.1) }
      else if (u < 0.7) { const q = Math.sqrt(R()) * r * 0.92; c.put(x + Math.cos(a) * q, r + Math.sin(a) * q, z + Math.sign(z) * 0.075, g, q > r * 0.6 ? 0.99 : q > r * 0.3 ? 0.4 : 0.82) }
      else if (u < 0.86) { const q = r * (0.95 + R() * 0.07); c.put(x + Math.cos(a) * q, r + Math.sin(a) * q, z + Math.sign(z) * 0.07, g, 0.4) }
      else { const t = R(); c.put(x + Math.cos(a) * 0.035, r + Math.sin(a) * 0.035, z + Math.sign(z) * (0.07 + t * 0.12), g, 0.62) }
    })
  }
  capWheel(0.62, 0.17, 0.36, 34, 0.04)
  capWheel(0.62, 0.17, -0.36, 35, 0.016)
  capWheel(-0.62, 0.21, 0.38, 36, 0.045)
  capWheel(-0.62, 0.21, -0.38, 37, 0.018)
  // axles
  for (const [x, r] of [[0.62, 0.17], [-0.62, 0.21]]) c.many(0.008, () => c.seg([x, r, -0.36], [x, r, 0.36], 30, 0.3, 0.008))
  // exhaust
  part(0.012, () => capPt([-0.45, 0.2, 0.15], [-0.92, 0.24, 0.16], 0.025, 0.03), 31, () => 0.4)
  c.many(0.006, () => c.put(-1.0 + J(0.01), 0.3 + G() * 0.03, G() * 0.08, 10, 0.99))
  roadKit(c, 0.18, 0.2, 80, 0.12)
  return c.finish()
}

/* ── the circuits ────────────────────────────────────────────────────── */

const PATHS = TRACK_PATHS as unknown as Record<string, [number, number][]>
export const trackPath = (id: string) => PATHS[id] ?? PATHS.coast

function track(id: string) {
  return (N: number) => {
    reseed(id === "coast" ? 223 : 227)
    const c = new Cloud(N)
    const P = trackPath(id)
    const M = P.length
    const at = (t: number): [V2, V2] => {
      const f = ((t % 1) + 1) % 1 * M
      const i = Math.floor(f), k = f - i
      const a = P[i % M], b = P[(i + 1) % M]
      const p: V2 = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
      const d = norm([b[0] - a[0], 0, b[1] - a[1]])
      return [p, [-d[2], d[0]]]
    }
    // curvature, for kerbs on the corners
    const curv = (t: number) => {
      const [, n0] = at(t - 0.006), [, n1] = at(t + 0.006)
      return Math.abs(n0[0] * n1[1] - n0[1] * n1[0])
    }
    const W = 0.05
    c.many(0.34, () => {
      const t = R(), [p, n] = at(t), s = R() < 0.5 ? -1 : 1
      c.put(p[0] + n[0] * W * s + J(0.003), 0, p[1] + n[1] * W * s + J(0.003), 0, 0.4)
    })
    c.many(0.12, () => {
      const t = R(), [p, n] = at(t), o = J(W * 0.9)
      c.put(p[0] + n[0] * o, -0.002, p[1] + n[1] * o, 4, 0.06)
    })
    c.many(0.1, () => {
      const t = R()
      if (curv(t) < 0.05) return
      const [p, n] = at(t), s = R() < 0.5 ? -1 : 1, o = W * (1.05 + R() * 0.35)
      c.put(p[0] + n[0] * o * s, 0.004, p[1] + n[1] * o * s, 1, Math.floor(t * 260) % 2 ? 0.99 : 0.4)
    })
    c.many(0.03, () => {
      const [, n] = at(0), o = J(W), along = R() * 0.03
      const [q] = at(along / 5.8)
      const row = Math.floor((o / W + 1) * 4) + Math.floor(along / 0.0075)
      c.put(q[0] + n[0] * o, 0.003, q[1] + n[1] * o, 2, row % 2 ? 0.4 : 0.04)
    })
    c.many(0.06, () => { const t = R(), [p] = at(t); c.put(p[0], 0.002, p[1], 5, t) })
    c.many(0.06, () => {
      const along = R() < 0.5, k = (Math.floor(R() * 13) - 6) * 0.17, t = J(1.1)
      c.put((along ? t : k) + J(0.003), -0.01, (along ? k : t) + J(0.003), 4, 0.04)
    })
    // six racers: a bottle-cap blob each, placed by the engine every frame
    for (let i = 0; i < 6; i++)
      c.many(0.035, () => {
        const a = R() * Math.PI * 2, u = R()
        const q = u < 0.6 ? Math.sqrt(R()) * 0.028 : 0.04 + R() * 0.008
        c.put(Math.cos(a) * q, 0.012 + J(0.006), Math.sin(a) * q, 40 + i, i === 0 ? 0.82 : [0.99, 0.04, 0.4, 0.62, 0.99][i - 1])
      })
    return c.finish()
  }
}

/* ── Ghana, with a pin for every circuit named after a real place ───── */

function ghana(N: number) {
  reseed(257)
  const c = new Cloud(N)
  const P = GHANA_OUTLINE.map(([lon, lat]) => toMap(lon, lat))
  const inside = (x: number, z: number) => {
    let o = false
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const [xi, zi] = P[i], [xj, zj] = P[j]
      if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) o = !o
    }
    return o
  }
  const L = P.map((p, i) => Math.hypot(P[(i + 1) % P.length][0] - p[0], P[(i + 1) % P.length][1] - p[1]))
  const tot = L.reduce((s, l) => s + l, 0)
  c.many(0.3, () => {
    let d = R() * tot, i = 0
    while (i < L.length - 1 && d > L[i]) d -= L[i++]
    const a = P[i], b = P[(i + 1) % P.length], f = d / L[i]
    c.put(a[0] + (b[0] - a[0]) * f + J(0.004), 0, a[1] + (b[1] - a[1]) * f + J(0.004), 0, 0.4)
  })
  c.many(0.34, () => {
    for (let k = 0; k < 20; k++) {
      const x = J(0.75), z = J(1.05)
      if (inside(x, z)) return c.put(x, -0.002, z, 1, 0.3)
    }
  })
  // a one-degree graticule
  c.many(0.08, () => {
    if (R() < 0.5) { const lon = -3 + Math.floor(R() * 5); const lat = 4.5 + R() * 7; const [x, z] = toMap(lon, lat); c.put(x, -0.004, z, 3, 0.2) }
    else { const lat = 5 + Math.floor(R() * 7); const lon = -3.4 + R() * 4.8; const [x, z] = toMap(lon, lat); c.put(x, -0.004, z, 3, 0.2) }
  })
  PINNED.forEach((t, i) => {
    const [px, pz] = toMap(t.lonlat![0], t.lonlat![1])
    c.many(0.024, () => {
      const u = R(), a = R() * Math.PI * 2
      if (u < 0.4) { const y = R() * 0.11; const r = (1 - y / 0.11) * 0.012; c.put(px + Math.cos(a) * r, y, pz + Math.sin(a) * r, 10 + i, 0.4) }
      else if (u < 0.85) { const b = Math.acos(J(1)); c.put(px + Math.sin(b) * Math.cos(a) * 0.026, 0.13 + Math.cos(b) * 0.026, pz + Math.sin(b) * Math.sin(a) * 0.026, 10 + i, 0.4) }
      else { const r = 0.03 + J(0.003); c.put(px + Math.cos(a) * r, 0, pz + Math.sin(a) * r, 10 + i, 0.4) }
    })
    c.many(0.012, () => c.put(R() * Math.PI * 2, 0, R(), 20 + i, 0.82))
  })
  return c.finish()
}

/* ── garage turntable ────────────────────────────────────────────────── */

function podium(N: number) {
  reseed(229)
  const c = new Cloud(N)
  c.many(0.4, () => {
    const ring = Math.floor(R() * 7), a = R() * Math.PI * 2
    const r = 0.3 + ring * 0.13 + J(0.004)
    c.put(Math.cos(a) * r, 0, Math.sin(a) * r, 0, ring === 6 ? 0.82 : 0.4 - ring * 0.03)
  })
  c.many(0.1, () => { const a = R() * Math.PI * 2, r = 1.1; c.put(Math.cos(a) * r, -R() * 0.12, Math.sin(a) * r, 0, 0.3) })
  c.many(0.05, () => { const k = Math.floor(R() * 24), a = (k / 24) * Math.PI * 2, r = 0.32 + R() * 0.76; c.put(Math.cos(a) * r, 0.001, Math.sin(a) * r, 0, 0.12) })
  c.many(0.28, () => { const y = R(), a = R() * Math.PI * 2, r = (0.12 + y * 0.9) * Math.sqrt(R()); c.put(Math.cos(a) * r, (1 - y) * 1.5, Math.sin(a) * r, 1, 0.4) })
  c.many(0.12, () => c.put(J(1.6), -0.14, J(1.2), 2, 0.04))
  c.many(0.05, () => c.put(J(1.1), R() * 0.4, J(0.9), 3, 0.82))
  return c.finish()
}

/* ── the cup ─────────────────────────────────────────────────────────── */

function trophy(N: number) {
  reseed(233)
  const c = new Cloud(N)
  // radius at height y, from the plinth up to the lip
  const prof = (y: number) => {
    if (y < -0.72) return 0.42
    if (y < -0.6) return 0.34
    if (y < -0.5) return 0.16
    if (y < -0.1) return 0.07 + Math.max(0, (y + 0.2) * 0.2)
    if (y < 0.1) return 0.12 + (y + 0.1) * 1.2
    return 0.36 + 0.16 * Math.sin(Math.min(1, (y - 0.1) / 0.62) * Math.PI * 0.5)
  }
  from(c, 0.7, () => {
    const y = -0.86 + R() * 1.58, a = R() * Math.PI * 2, r = prof(y)
    const n: V3 = [Math.cos(a), 0.1, Math.sin(a)]
    if (!facing(n)) return null
    return [[Math.cos(a) * r, y, Math.sin(a) * r], n]
  }, 0, (n, p) => (p[1] > -0.1 ? 0.62 + lit(n) * 0.36 : 0.3 + lit(n) * 0.25))
  c.many(0.06, () => { const a = R() * Math.PI * 2; c.put(Math.cos(a) * 0.52, 0.72 + J(0.006), Math.sin(a) * 0.52, 0, 0.9) })
  for (const s of [1, -1])
    c.many(0.07, () => {
      const a = (R() - 0.5) * Math.PI * 1.1, r = 0.2
      c.put(s * (0.5 + Math.cos(a) * r * 0.8), 0.38 + Math.sin(a) * r, J(0.02), 0, 0.82)
    })
  const word = wordPoints("ACCRA CUP", 700)
  c.many(0.05, () => { const p = pick(word); c.put(p[0] * 0.5, -0.66 + p[1] * 0.5, 0.43, 0, 0.04) })
  c.many(0.02, () => { const a = R() * Math.PI * 2, r = 0.6 + R() * 0.35; c.put(Math.cos(a) * r, -0.6 + R() * 1.5, Math.sin(a) * r * 0.6, 1, 0.82) })
  return c.finish()
}

/* ── the six items, sampled from their own icons ─────────────────────── */

function itemCloud(id: string) {
  return (N: number) => {
    reseed(239)
    const c = new Cloud(N)
    const it = ITEMS.find((i) => i.id === id) ?? ITEMS[0]
    const S = 360
    const cv = document.createElement("canvas")
    cv.width = cv.height = S
    const x = cv.getContext("2d", { willReadFrequently: true })
    const pts: V2[] = [], edge: V2[] = []
    if (x) {
      x.scale(S / 512, S / 512)
      x.fillStyle = "#fff"
      x.fill(new Path2D(it.d))
      const d = x.getImageData(0, 0, S, S).data
      const on = (i: number, j: number) => i >= 0 && j >= 0 && i < S && j < S && d[(j * S + i) * 4 + 3] > 120
      for (let j = 0; j < S; j += 2)
        for (let i = 0; i < S; i += 2) {
          if (!on(i, j)) continue
          const p: V2 = [i / S - 0.5, 0.5 - j / S]
          pts.push(p)
          if (!on(i - 3, j) || !on(i + 3, j) || !on(i, j - 3) || !on(i, j + 3)) edge.push(p)
        }
    }
    if (!pts.length) pts.push([0, 0])
    if (!edge.length) edge.push([0, 0])
    c.many(0.46, () => { const p = pick(pts); c.put(p[0] * 1.7 + J(0.003), p[1] * 1.7 + J(0.003), J(0.06), 0, 0.82) })
    c.many(0.2, () => { const p = pick(edge); const z = R() < 0.5 ? 0.06 : -0.06; c.put(p[0] * 1.7, p[1] * 1.7, z, 0, 0.94) })
    c.many(0.2, () => { const a = R() * Math.PI * 2, r = 1.02 + J(0.015); c.put(Math.cos(a) * r, Math.sin(a) * r, J(0.02), 1, Math.floor((a / (Math.PI * 2)) * 36) % 2 ? 0.4 : 0.82) })
    c.many(0.06, () => c.put(R() * Math.PI * 2, 1.15 + R() * 0.35, J(0.4), 2, 0.82))
    return c.finish()
  }
}

/* ── controller ──────────────────────────────────────────────────────── */

function controller(N: number) {
  reseed(241)
  const c = new Cloud(N)
  const S = 400
  const cv = document.createElement("canvas")
  cv.width = S
  cv.height = Math.round(S * 0.62)
  const x = cv.getContext("2d", { willReadFrequently: true })
  const fill: V2[] = [], edge: V2[] = []
  if (x) {
    const H = cv.height
    x.fillStyle = "#fff"
    x.beginPath()
    x.moveTo(110, 40)
    x.lineTo(290, 40)
    x.bezierCurveTo(350, 40, 380, 90, 392, 170)
    x.bezierCurveTo(400, 225, 370, 245, 340, 236)
    x.bezierCurveTo(305, 225, 290, 180, 255, 170)
    x.lineTo(145, 170)
    x.bezierCurveTo(110, 180, 95, 225, 60, 236)
    x.bezierCurveTo(30, 245, 0, 225, 8, 170)
    x.bezierCurveTo(20, 90, 50, 40, 110, 40)
    x.fill()
    const d = x.getImageData(0, 0, S, H).data
    const on = (i: number, j: number) => i >= 0 && j >= 0 && i < S && j < H && d[(j * S + i) * 4 + 3] > 120
    for (let j = 0; j < H; j += 2)
      for (let i = 0; i < S; i += 2) {
        if (!on(i, j)) continue
        const p: V2 = [(i - S / 2) / (S / 2), (H / 2 - j) / (S / 2)]
        fill.push(p)
        if (!on(i - 4, j) || !on(i + 4, j) || !on(i, j - 4) || !on(i, j + 4)) edge.push(p)
      }
  }
  if (!fill.length) fill.push([0, 0])
  if (!edge.length) edge.push([0, 0])
  c.many(0.3, () => { const p = pick(fill); c.put(p[0] * 1.1, p[1] * 1.1, 0, 0, 0.18 + (p[1] + 0.6) * 0.15) })
  c.many(0.18, () => { const p = pick(edge); c.put(p[0] * 1.1, p[1] * 1.1, J(0.08), 0, 0.4) })
  const disc = (cx: number, cy: number, r: number, g: number, tone: number, share: number, ring = false) =>
    c.many(share, () => { const a = R() * Math.PI * 2, q = ring ? r * (0.85 + R() * 0.15) : Math.sqrt(R()) * r; c.put(cx + Math.cos(a) * q, cy + Math.sin(a) * q, 0.05, g, tone) })
  disc(0.62, 0.36, 0.055, 1, 0.82, 0.02)
  disc(0.74, 0.24, 0.055, 2, 0.99, 0.02)
  disc(0.5, 0.24, 0.055, 3, 0.04, 0.02)
  disc(0.62, 0.12, 0.055, 4, 0.62, 0.02)
  for (const [w, h] of [[0.2, 0.06], [0.06, 0.2]]) c.many(0.025, () => c.put(-0.62 + J(w), 0.24 + J(h), 0.05, 5, 0.4))
  disc(-0.32, 0.0, 0.11, 6, 0.4, 0.04, true)
  disc(0.32, 0.0, 0.11, 7, 0.4, 0.04, true)
  disc(-0.32, 0.0, 0.05, 6, 0.3, 0.015)
  disc(0.32, 0.0, 0.05, 7, 0.3, 0.015)
  for (const s of [1, -1]) c.many(0.03, () => c.put(s * (0.62 + J(0.16)), 0.6 + R() * 0.06, -0.02 + J(0.04), 8, 0.82))
  c.many(0.05, () => c.put(J(1.4), -0.7, J(0.8), 9, 0.04))
  return c.finish()
}

/* ── chequered flag ──────────────────────────────────────────────────── */

function flag(N: number) {
  reseed(251)
  const c = new Cloud(N)
  c.many(0.84, () => {
    const u = R(), v = R()
    const check = (Math.floor(u * 8) + Math.floor(v * 6)) % 2
    c.put(u, v, 0, 0, check ? 0.4 : 0.82)
  })
  c.many(0.1, () => c.put(0, R() * 1.9, J(0.012), 1, 0.4))
  c.many(0.03, () => { const a = R() * Math.PI * 2, q = Math.sqrt(R()) * 0.04; c.put(Math.cos(a) * q, 1.93 + Math.sin(a) * q, 0, 1, 0.4) })
  return c.finish()
}

const CLOUDS: Record<string, (n: number) => Float32Array> = {
  car,
  coast: track("coast"),
  compound: track("compound"),
  ghana,
  podium,
  trophy,
  controller,
  flag,
  ...Object.fromEntries(ITEMS.map((i) => ["item-" + i.id, itemCloud(i.id)])),
}
export const buildCloud = (name: string, n: number) => CLOUDS[name](n)
