import type { Metadata } from "next"

import { PageShell } from "@/components/konko/page-shell"
import { EMAIL } from "@/data/game"

const SECTIONS = [
  ["in-short", "In short"],
  ["on-device", "Information on your device"],
  ["online", "Online races"],
  ["not-collected", "What we don’t collect"],
  ["children", "Children"],
  ["choices", "Your choices"],
  ["changes", "Changes"],
  ["contact", "Contact"],
]

export const metadata: Metadata = {
  title: "Privacy policy | KonKo Rush",
  description: "How KonKo Rush handles your information.",
}

export default function Privacy() {
  return (
    <PageShell
      title="Privacy policy"
      lead="Last updated 7 November 2026"
      aside={
        <nav aria-label="On this page" className="max-lg:hidden">
          <p className="hud text-muted-foreground">On this page</p>
          <ol className="mt-4 border-l border-foreground/15">
            {SECTIONS.map(([id, t]) => (
              <li key={id}>
                <a href={`#${id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-[0.9375rem] text-foreground/75 transition-colors hover:border-signal hover:text-foreground">
                  {t}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      }
    >
      <p>
        This policy explains what information KonKo Rush (&ldquo;the game&rdquo;) uses, why, and the choices you have. The game is made by Kudjo Ewusi Mensah (&ldquo;we&rdquo;).
      </p>
      <h2 id="in-short">In short</h2>
      <ul>
        <li>We don&rsquo;t sell your information, show ads or track you across other apps.</li>
        <li>Your progress and settings stay on your device.</li>
        <li>Online races use an anonymous player ID and the driver name you choose.</li>
      </ul>
      <h2 id="on-device">Information on your device</h2>
      <p>The game saves your progress (cars, credits, upgrades and race results) and your settings on your device. We can&rsquo;t see this information, and it is deleted when you delete the game.</p>
      <h2 id="online">Online races</h2>
      <p>When you open online play, the game signs in to Unity Gaming Services, run by Unity Technologies, to make and join rooms. This uses:</p>
      <ul>
        <li>
          <strong>An anonymous player ID</strong>, created by Unity&rsquo;s sign-in service. It isn&rsquo;t linked to your name, email or Apple account.
        </li>
        <li>
          <strong>Your driver name</strong>, which you type yourself. Other players in your room see it above your car.
        </li>
        <li>
          <strong>Race data</strong>, such as car positions and items used, sent between players during a race so everyone sees the same race.
        </li>
      </ul>
      <p>
        Unity processes this information to provide the online service. See{" "}
        <a href="https://unity.com/legal/privacy-policy" rel="noopener">
          Unity&rsquo;s privacy policy
        </a>
        . If you never open online play, none of this is created.
      </p>
      <h2 id="not-collected">What we don&rsquo;t collect</h2>
      <p>The game doesn&rsquo;t collect your name, email address, contacts, location, photos or payment details. It contains no advertising and no analytics.</p>
      <h2 id="children">Children</h2>
      <p>The game is suitable for players aged 9 and over. We don&rsquo;t knowingly collect personal information from children. Driver names are shown only to players in the same room, so players shouldn&rsquo;t use their real name.</p>
      <h2 id="choices">Your choices</h2>
      <ul>
        <li>Play offline, and no online data is created.</li>
        <li>Change your driver name at any time in the online menu.</li>
        <li>Delete the game to remove everything stored on your device.</li>
        <li>Email us to ask about, or delete, information linked to your player ID.</li>
      </ul>
      <h2 id="changes">Changes</h2>
      <p>If the game starts using information in new ways, such as accounts, purchases or analytics, we&rsquo;ll update this policy first and change the date above.</p>
      <h2 id="contact">Contact</h2>
      <p>
        Questions about privacy: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>
    </PageShell>
  )
}
