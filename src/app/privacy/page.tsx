import type { Metadata } from "next"

import { PageShell } from "@/components/konko/page-shell"
import { EMAIL } from "@/data/game"

const SECTIONS = [
  ["in-short", "In short"],
  ["on-device", "Information on your device"],
  ["online", "Online races"],
  ["leaderboards", "Leaderboards"],
  ["advertising", "Advertising"],
  ["not-collected", "What we don’t collect"],
  ["children", "Children"],
  ["choices", "Your choices"],
  ["changes", "Changes"],
  ["contact", "Contact"],
]

export const metadata: Metadata = {
  alternates: { canonical: "/privacy.html" },
  openGraph: { url: "/privacy.html", images: ["/assets/img/keyart.jpg"] },
  title: "Privacy policy | KonKo Rush",
  description: "How KonKo Rush handles your information.",
}

export default function Privacy() {
  return (
    <PageShell
      title="Privacy policy"
      lead="Last updated 21 November 2026"
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
        <li>The game shows ads, served through Unity LevelPlay. Ads are personalised only if you allow it.</li>
        <li>You can turn off personalised ads, or opt out of the sale or sharing of your data, in Settings at any time.</li>
        <li>Your progress and settings stay on your device.</li>
        <li>Online races and leaderboards use an anonymous player ID and the driver name you choose.</li>
        <li>You can delete your online account and leaderboard entries in Settings at any time.</li>
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
        Unity processes this information to provide the online rooms. See{" "}
        <a href="https://unity.com/legal/privacy-policy" rel="noopener">
          Unity&rsquo;s privacy policy
        </a>
        . If you never open online play, none of this is created.
      </p>
      <h2 id="leaderboards">Leaderboards</h2>
      <p>
        The game has weekly and all-time leaderboards, run on Supabase, a hosted database service with servers in London. When the game starts, it signs in to Supabase with an anonymous account. There&rsquo;s no sign-up and no email or password. The game sends:
      </p>
      <ul>
        <li>
          <strong>An anonymous account ID</strong>, created by Supabase. It isn&rsquo;t linked to your name, email or Apple account, and it is never shown to other players.
        </li>
        <li>
          <strong>Your driver name</strong>, which other players see on the leaderboards next to a random public ID.
        </li>
        <li>
          <strong>Your results</strong>: best lap times (with the circuit, car and mode), total career stars and your places in online races.
        </li>
        <li>
          <strong>The platform and game version</strong>, so results can be checked and problems fixed.
        </li>
      </ul>
      <p>
        Driver names are checked against a list of offensive words. Any player can report a name, and a name reported by three different players is hidden everywhere. You can delete your online account, with all of its leaderboard entries, in Settings &gt; Gameplay &gt; Delete online account.
      </p>
      <h2 id="advertising">Advertising</h2>
      <p>
        The game is free to play and shows ads: an optional video you can choose to watch for extra credits, and an occasional full-screen ad between races. Ads are provided through Unity LevelPlay, run by Unity Technologies, and its advertising partners (such as Unity Ads).
      </p>
      <p>To choose, show and measure ads, LevelPlay and its partners may collect:</p>
      <ul>
        <li>
          <strong>Device identifiers</strong>, such as your device&rsquo;s advertising identifier (on iPhone, only if you allow tracking when the game asks).
        </li>
        <li>
          <strong>Device and usage information</strong>, such as device model, operating system, language, approximate location derived from your IP address, and which ads you saw or tapped.
        </li>
      </ul>
      <p>Your choices about ads:</p>
      <ul>
        <li>
          <strong>On iPhone</strong>, the game asks whether to allow tracking. If you say no, your advertising identifier isn&rsquo;t shared. You can change this in iOS Settings &gt; Privacy &amp; Security &gt; Tracking.
        </li>
        <li>
          <strong>In the EU, EEA, UK and Switzerland</strong>, the game asks for your consent before ads are personalised. Change your answer at any time in the game&rsquo;s Settings &gt; Gameplay &gt; Personalised ads.
        </li>
        <li>
          <strong>Everywhere</strong>, you can opt out of the sale or sharing of your information for advertising in Settings &gt; Gameplay &gt; Sell or share my data.
        </li>
      </ul>
      <p>
        If you decline, you still see ads, just less relevant ones. See{" "}
        <a href="https://unity.com/legal/game-player-and-app-user-privacy-policy" rel="noopener">
          Unity&rsquo;s privacy policy for players
        </a>{" "}
        for how Unity and LevelPlay handle this information.
      </p>
      <h2 id="not-collected">What we don&rsquo;t collect</h2>
      <p>The game doesn&rsquo;t collect your name, email address, contacts, photos or payment details. We don&rsquo;t run our own analytics.</p>
      <h2 id="children">Children</h2>
      <p>The game is suitable for players aged 9 and over. We don&rsquo;t knowingly collect personal information from children. Driver names are shown to other players in online rooms and on the leaderboards, so players shouldn&rsquo;t use their real name.</p>
      <h2 id="choices">Your choices</h2>
      <ul>
        <li>Change your driver name at any time in the online menu.</li>
        <li>Delete your online account and leaderboard entries in Settings &gt; Gameplay &gt; Delete online account.</li>
        <li>Turn off personalised ads, or opt out of the sale or sharing of your data, in Settings &gt; Gameplay.</li>
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
