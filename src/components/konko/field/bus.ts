import { useSyncExternalStore } from "react"

/** Mutable, per-frame values shared between widgets and the particle field. No React renders. */
export const bus = {
  /** 0..1 loudness of whatever is being spoken */
  audio: 0,
  /** scrubbed minute of the sample run */
  minute: 8 * 60 + 12,
  /** the visitor's van: 1 off-screen, 0 parked */
  arrive: 1,
  joined: 0,
  /** your car's place on the shown lap, 0..1 */
  lap: 0,
  /** highlighted pin on the Ghana map, -1 for none */
  pin: -1,
}

export type Theme = "night" | "day" | "brand"
export interface SceneState {
  index: number
  id: string
  label: string
  theme: Theme
}

let scene: SceneState = { index: 0, id: "top", label: "Grid", theme: "night" }
const subs = new Set<() => void>()
export function setScene(next: SceneState) {
  if (next.index === scene.index && next.id === scene.id) return
  scene = next
  subs.forEach((f) => f())
}
const serverScene = scene
export const useScene = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => scene,
    () => serverScene
  )
