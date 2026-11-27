"use client"

import { X } from "lucide-react"
import { useRef, useState } from "react"

import { GALLERY } from "@/data/game"

export function Gallery() {
  const box = useRef<HTMLDialogElement>(null)
  const [shot, setShot] = useState(GALLERY[0])
  return (
    <section id="gallery" data-scene="gallery" data-label="Gallery" data-theme="night" className="relative">
      <div data-field="none" aria-hidden="true" className="absolute inset-0" />
      <div className="gutter relative z-10 pt-20 pb-24">
        <h2 className="display-md">In the game</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {GALLERY.map((g, i) => (
            <button
              key={g.src}
              type="button"
              aria-label={`Open screenshot: ${g.alt}`}
              onClick={() => {
                setShot(g)
                box.current?.showModal()
              }}
              className={`cut group cursor-zoom-in overflow-hidden ${i === 0 ? "col-span-2 lg:col-span-2 lg:row-span-2" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/assets/img/${g.src}.jpg`} alt={g.alt} width={1400} height={788} loading="lazy" className="aspect-video h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" />
            </button>
          ))}
        </div>
      </div>
      <dialog ref={box} aria-label="Screenshot" onClick={(e) => e.target === box.current && box.current?.close()} className="m-auto max-h-[92svh] max-w-[min(92vw,1400px)] bg-transparent p-0 backdrop:bg-black/85">
        <form method="dialog">
          <button aria-label="Close" className="absolute top-3 right-3 grid size-10 cursor-pointer place-items-center rounded-full bg-black/60 text-white">
            <X className="size-5" />
          </button>
        </form>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/assets/img/${shot.src}.jpg`} alt={shot.alt} className="max-h-[92svh] w-auto" />
      </dialog>
    </section>
  )
}
