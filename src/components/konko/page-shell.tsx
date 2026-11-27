import { Nav } from "./chrome"
import { Footer } from "./footer"

/** Plain pages (support, privacy): same type and HUD styling, no particle field. */
export function PageShell({ title, lead, aside, children }: { title: string; lead: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <Nav home={false} />
      <main id="main" className="gutter pt-36 pb-20">
        <h1 className="display-xl">{title}</h1>
        <p className="mt-4 text-[1.125rem] text-muted-foreground">{lead}</p>
        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,44rem)_minmax(0,22rem)]">
          {aside && <aside className="lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:self-start">{aside}</aside>}
          <div className="text-[1.0625rem] leading-[1.65] lg:col-start-1 lg:row-start-1 [&_a]:text-signal [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:scroll-mt-28 [&_h2]:font-display [&_h2]:text-[1.875rem] [&_h2]:font-light [&_h2]:tracking-[-0.02em] [&_h2:first-child]:mt-0 [&_li]:mt-2 [&_p]:mt-4 [&_strong]:font-semibold [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-signal">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
