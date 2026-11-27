import { setScene, type Theme } from "./bus"

/** Finds the section in view and applies its theme. Used by the engine, or on its own when WebGL is missing. */
export function applyScene(els: HTMLElement[], viewH: number) {
  let idx = 0
  for (let i = 0; i < els.length; i++) if (els[i].getBoundingClientRect().top <= viewH * 0.52) idx = i
  const el = els[idx]
  const theme = (el.dataset.theme as Theme) || "night"
  const root = document.documentElement
  if (root.dataset.theme !== theme) {
    root.dataset.theme = theme
    root.classList.toggle("dark", theme === "night")
  }
  setScene({ index: idx, id: el.dataset.scene || "", label: el.dataset.label || "", theme })
  return { el, theme }
}

export const sceneElements = () => [...document.querySelectorAll<HTMLElement>("[data-scene]")]

/** Theme switching without a canvas. Returns a cleanup. */
export function watchScenes() {
  let raf = 0
  const run = () => {
    raf = 0
    const els = sceneElements()
    if (els.length) applyScene(els, window.innerHeight)
  }
  const queue = () => (raf ||= requestAnimationFrame(run))
  run()
  window.addEventListener("scroll", queue, { passive: true })
  window.addEventListener("resize", queue)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener("scroll", queue)
    window.removeEventListener("resize", queue)
  }
}
