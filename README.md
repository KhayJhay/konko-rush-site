# KonKo Rush site

The game's website: Next.js 16, Tailwind 4, ElevenLabs UI components and a WebGL2 particle field that re-forms per section (the #63 tin formula, a picker for all seven circuits with traced maps and a Ghana map of where they are, the garage turntable, the cup, the six items, a controller and the chequered flag).

```bash
npm install
npm run dev
npm run build   # static site in ./out
```

## Deploy

`docker build -t konko-rush .` builds the site and serves `out/` with nginx (`nginx.conf`). `/privacy.html` and `/support.html` keep their URLs for the App Store listing, and `/privacy` and `/support` work too.

## Where things are

- `src/components/konko/sections`: page sections; `src/app/support` and `src/app/privacy`: the plain pages
- `src/components/konko/field`: the particle engine. `forms.ts` builds each shape, `form-glsl.ts` animates them
- `src/data/game.ts`: cars, tracks, modes, items; `src/data/tracks.json`: circuit outlines traced from the SVG maps
- `public/assets/img`: game art, unchanged
