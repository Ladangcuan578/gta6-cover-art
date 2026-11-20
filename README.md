[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Ladangcuan578/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Ladangcuan578/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Shore Cover Lab

An offline browser app that turns your photos and a caption into GTA-style
cover art: a multi-panel poster with bold lettering and a Vice City neon-sunset
grade, exported as a PNG to share. Built for the
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty.

Everything runs on your machine — photos are read locally and never uploaded,
and the app makes no network request at all.

## How it works

1. **Upload** — drop photos in, pick files, or try one of the four built-in
   samples (two photos plus two original scenes drawn by the app itself).
2. **Arrange** — pick one of 8 layouts, drag photos inside their panels to
   reposition them, scroll or slide to zoom, flip or rotate a panel, give a
   panel its own grade or border, or shuffle the photos across the panels.
3. **Lettering** — write the title and subtitle, choose the title font
   (Anton, Archivo Black or Bebas Neue) and style (sunset gradient, white,
   neon glow or outline), move the title block, edit the badge ribbon and
   set the heat-meter stars.
4. **Export** — one click saves all four sizes at full resolution:
   1920 × 1080, 1080 × 1080, 1080 × 1350 and story 1080 × 1920, named after
   your title. Single sizes work too.

## What is inside

- **8 layouts** — Nine-Panel Grid, Hero + Three, Four-Panel, Tilted
  Snapshots, Split Screen, Full-Bleed, Triptych and Magazine, each with its
  own title block and position options.
- **7 gradient-map grades** — Sunset, Neon Nights, Heat, Vice, Golden Hour,
  Pastel Vice and Mono Noir, applied per pixel through a lookup table, with a
  strength slider and a per-panel override.
- **5 one-click presets** — Sunset Sleeve, Neon Nights, Pier Pressure,
  Golden Hour and Mono Noir.
- **Lettering** — Anton for tall condensed titles, Archivo Black for heavy
  blocks, Bebas Neue for labels, Pacifico for the neon-glow subtitle.
- **Effects** — film grain, vignette, halftone title block, ink panel
  borders and a badge ribbon with a star heat meter.
- **Editor** — undo/redo (buttons and Ctrl+Z / Ctrl+Shift+Z), keyboard
  shortcuts (E to export, B to hold for before/after, 1–8 for layouts,
  arrow keys to nudge a photo), drag-and-drop for many files at once, a
  hold-to-compare before/after view, live preview zoom, and a 4-step
  progress indicator.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Fonts

The fonts under `app/fonts/` are from the
[google/fonts](https://github.com/google/fonts) repository under the SIL Open
Font License; each one ships with its `OFL.txt` next to it:

- Anton — `ofl/anton/Anton-Regular.ttf`
- Bebas Neue — `ofl/bebasneue/BebasNeue-Regular.ttf`
- Pacifico — `ofl/pacifico/Pacifico-Regular.ttf`
- Archivo Black — `ofl/archivoblack/ArchivoBlack-Regular.ttf`

No Rockstar Games logo, wordmark, artwork, character or font is used
anywhere in this app. The two sample photos under `app/samples/` were made
for make.fun with an image model and are free to use; the two sample scenes
are drawn by the app's own code.

## License

MIT — see `LICENSE`.
