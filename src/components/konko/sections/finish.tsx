import { Footer } from "../footer"
import { GetButtons } from "../get-buttons"

export function Finish() {
  return (
    <section id="get" data-scene="get" data-label="Finish" data-theme="brand" className="relative flex min-h-[110svh] flex-col overflow-clip">
      <div aria-hidden="true" className="absolute inset-x-[-4vw] bottom-[22rem] h-[44svh] lg:inset-y-0 lg:right-[-2vw] lg:bottom-[12rem] lg:left-[48vw] lg:h-auto">
        <div data-field="flag" className="h-full lg:sticky lg:top-[14svh] lg:h-[70svh]" />
      </div>
      <div className="gutter relative z-10 pt-28 lg:pt-[20svh]">
        <h2 className="display-xl max-w-[9ch]">Start your engine.</h2>
        <p className="mt-6 max-w-[30rem] text-[1.125rem] leading-[1.5]">KonKo Rush is free on the App Store for iPhone, iPad and Mac, and as a download for Windows. Android is on the way.</p>
        <GetButtons className="mt-8" />
        <p className="mt-5 max-w-[30rem] text-[0.9375rem] leading-normal text-muted-foreground">
          The Windows version comes as a .zip from Google Drive. Questions? <a href="/support.html" className="font-medium text-foreground underline underline-offset-4">Visit support</a>.
        </p>
      </div>
      <Footer className="relative z-10 mt-auto pt-[46svh] lg:pt-28" />
    </section>
  )
}
