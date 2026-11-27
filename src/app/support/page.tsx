import type { Metadata } from "next"

import { PageShell } from "@/components/konko/page-shell"
import { EMAIL } from "@/data/game"

export const metadata: Metadata = {
  title: "Support | KonKo Rush",
  description: "Help with KonKo Rush: controls, progress, online races and how to contact us.",
}

const FAQ: [string, string][] = [
  ["Which devices can play KonKo Rush?", "iPhones running iOS 15 or later. Android, Windows and Mac versions are on the way."],
  ["How do I steer on my phone?", "Open Settings and choose Tilt, Tap or TouchDrive. TouchDrive steers for you and keeps you on the road, so you can concentrate on drifting, nitro and items. Auto-accelerate is on by default on phones."],
  ["Can I use a controller?", "Yes. Connect any controller your device supports. Every menu works with the d-pad or stick, and you can change any button in Settings, under Buttons."],
  ["My car is stuck. What do I do?", "Press the reset button (R on a keyboard) to put the car back on the road. With TouchDrive, the car also backs off obstacles by itself."],
  ["How do I unlock more cars?", "Earn credits by racing and meet each tier's goal, such as winning three races or winning the Accra Cup. Cars can't be bought with real money."],
  ["Is my progress saved?", "Progress and settings are saved on your device. Deleting the app deletes them too, and they don't move to a new device yet."],
  ["How do online races work?", "Online races with friends are still being tested. When they're ready, one player makes a room and shares its code, and friends join with that code."],
  ["Does the game have ads or purchases?", "No. KonKo Rush currently has no ads and no in-app purchases."],
  ["The game looks wrong or runs slowly", "Try a lower quality in Settings, under Graphics, and close other apps. If the problem stays, email us with your device model."],
]

export default function Support() {
  return (
    <PageShell
      title="Support"
      lead="Answers to common questions, and how to reach us."
      aside={
        <section aria-labelledby="contact" className="cut bg-card py-6 pr-8 pl-9 [&_a]:text-signal [&_a]:underline [&_a]:underline-offset-4">
          <h2 id="contact" className="font-display text-[1.5rem] font-light tracking-[-0.02em]">
            Contact us
          </h2>
          <p className="mt-2 text-[1.0625rem] leading-[1.6]">
            Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Tell us your device, the game version (shown on the title screen) and what happened.
          </p>
        </section>
      }
    >
      <h2>Common questions</h2>
      <div className="border-b">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group border-t py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] [&::-webkit-details-marker]:hidden">
              {q}
              <span aria-hidden="true" className="text-xl text-signal transition-transform duration-300 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <h2>Privacy</h2>
      <p>
        Read how the game handles your information in our <a href="/privacy.html">privacy policy</a>.
      </p>
    </PageShell>
  )
}
