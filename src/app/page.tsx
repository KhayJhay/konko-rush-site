import { Dock, Minimap, Nav } from "@/components/konko/chrome"
import { ParticleField } from "@/components/konko/field/particle-field"
import { Finish } from "@/components/konko/sections/finish"
import { Gallery } from "@/components/konko/sections/gallery"
import { Garage } from "@/components/konko/sections/garage"
import { Hero } from "@/components/konko/sections/hero"
import { Items } from "@/components/konko/sections/items"
import { Modes } from "@/components/konko/sections/modes"
import { Play } from "@/components/konko/sections/play"
import { Tracks } from "@/components/konko/sections/tracks"
import { Workshop } from "@/components/konko/sections/workshop"

export default function Page() {
  return (
    <>
      <ParticleField />
      <Nav />
      <main id="main" className="relative z-10">
        <Hero />
        <Workshop />
        <Tracks />
        <Garage />
        <Modes />
        <Items />
        <Gallery />
        <Play />
        <Finish />
      </main>
      <Minimap />
      <Dock />
    </>
  )
}
