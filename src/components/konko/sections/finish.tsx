import { Footer } from "../footer"

export function Finish() {
  return (
    <section id="get" data-scene="get" data-label="Finish" data-theme="brand" className="relative flex min-h-[110svh] flex-col overflow-clip">
      <div aria-hidden="true" className="absolute inset-x-[-4vw] bottom-[22rem] h-[44svh] lg:inset-y-0 lg:right-[-2vw] lg:bottom-[12rem] lg:left-[48vw] lg:h-auto">
        <div data-field="flag" className="h-full lg:sticky lg:top-[14svh] lg:h-[70svh]" />
      </div>
      <div className="gutter relative z-10 pt-28 lg:pt-[20svh]">
        <h2 className="display-xl max-w-[9ch]">Start your engine.</h2>
        <p className="mt-6 max-w-[28rem] text-[1.125rem] leading-[1.5]">KonKo Rush is coming soon to the App Store, with Android, Windows and Mac to follow.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <span className="cut inline-flex h-12 items-center bg-primary px-7 text-[0.9375rem] font-semibold tracking-[0.03em] text-primary-foreground uppercase">Coming soon to the App Store</span>
          <a href="/support.html" className="cut inline-flex h-12 items-center bg-foreground/10 px-6 text-[0.9375rem] font-medium tracking-[0.03em] uppercase transition-colors hover:bg-foreground/20">
            Questions? Visit support
          </a>
        </div>
      </div>
      <Footer className="relative z-10 mt-auto pt-[46svh] lg:pt-28" />
    </section>
  )
}
