import { Nav } from "./chrome"
import { Footer } from "./footer"

/** Plain pages (support, privacy): same type and HUD styling, no particle field. */
export function PageShell({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <>
      <Nav home={false} />
      <main id="main" className="gutter pt-36 pb-20">
        <h1 className="display-xl">{title}</h1>
        <p className="hud mt-5 text-muted-foreground">{lead}</p>
        <div className="mt-12 max-w-[44rem] text-[1.0625rem] leading-[1.65] [&_a]:text-signal [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-[1.875rem] [&_h2]:font-light [&_h2]:tracking-[-0.02em] [&_li]:mt-2 [&_p]:mt-4 [&_strong]:font-semibold [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-signal">
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}
