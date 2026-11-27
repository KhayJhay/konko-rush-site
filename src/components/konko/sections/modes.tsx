import { MODES } from "@/data/game"

export function Modes() {
  return (
    <section id="modes" data-scene="modes" data-label="Modes" data-theme="day" className="relative overflow-clip">
      <div className="gutter pt-24 pb-28 lg:pt-28">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_minmax(0,0.9fr)]">
          <h2 data-veil className="display-xl w-fit">
            Four ways
            <br />
            to <span className="text-signal italic">win.</span>
          </h2>
          <div data-field="trophy" aria-hidden="true" className="h-[30svh] max-lg:hidden lg:h-[38svh]" />
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODES.map((m) => (
            <li key={m.name} className="group relative overflow-hidden bg-card" style={{ "--c": m.color } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/assets/img/${m.img}.jpg`} alt="" width={1200} height={675} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" />
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[var(--c)]" />
              <div className="p-5">
                <h3 className="font-display text-[1.5rem] font-light tracking-[-0.02em]">{m.name}</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-normal text-muted-foreground">{m.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
