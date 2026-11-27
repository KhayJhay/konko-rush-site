import { CONTROLS } from "@/data/game"

export function Play() {
  return (
    <section id="play" data-scene="play" data-label="Controls" data-theme="day" className="relative overflow-clip">
      <div className="gutter grid min-h-[90svh] grid-cols-[minmax(0,1fr)] items-center gap-x-12 gap-y-6 pt-24 pb-28 lg:grid-cols-2">
        <div data-veil className="relative z-10">
          <h2 className="display-lg">
            Any hands,
            <br />
            any screen.
          </h2>
          <dl className="mt-8 max-w-[32rem]">
            {CONTROLS.map((c) => (
              <div key={c.name} className="border-t py-4">
                <dt className="flex flex-wrap items-center gap-3 text-[1.125rem]">
                  {c.name}
                  <span className="flex gap-1">
                    {c.keys.map((k) => (
                      <kbd key={k} className="hud rounded-md border border-foreground/25 border-b-[3px] bg-background px-2 py-0.5 text-[0.6875rem] text-foreground">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </dt>
                <dd className="mt-1.5 text-[0.9375rem] leading-normal text-muted-foreground">{c.body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div data-field="controller" aria-hidden="true" className="h-[40svh] lg:h-[60svh]" />
      </div>
    </section>
  )
}
