# Screens the site needs

Every app image on the page is a real screenshot of Kobra 1.0, cut from captures by `python scripts/screens.py` (`npm run screens`) with the boxes in `scripts/screens.json`.

## Rules

- **Real captures only.** No redrawn or simulated interface in these files.
- **Nothing is enlarged.** The captures are 4320×2700 (a 1440×900 window at 300%). Every file is a downscale; the script stops with an error rather than upscale.
- **Nothing is cut through.** A crop is exactly its box, in its own proportions; no box is grown or trimmed to fit a slot. Each box frames a whole unit: a window, a card, a panel, a tool row.
- **Pages show files as they are.** Slots use the file's own aspect ratio (or `object-fit: contain`), so CSS never crops a screenshot. `node tests/image-audit.mjs <url>` checks every image at 1440@2x, 1920@1x, 1024@2x and 390@3x: it fails if any image is drawn larger than its pixels, stretched, or cropped by more than 2%.

## How to recapture

1. In the desktop app folder: `KOBRA_REVIEW_SCALE=3 npx electron . --review-site` (`electron/review-site.cjs`). It writes `<name>-light.png` and `<name>-dark.png` to `showcase/captures/` (ignored by git) from the demo library, with no toasts, hovers or hints.
2. In `showcase/`: `npm run screens`, then `npm run verify` and the image audit.
3. If the app's layout moves, re-measure the crop boxes in `scripts/screens.json` (CSS pixels of the 1440×900 window).

## Full windows (`<name>-1440.webp`, `<name>-2880.webp`)

| Name (`-light`, `-dark`) | Used for | App state |
|---|---|---|
| `watch` | Hero display (WebGL texture uses 2880) and handoff | Kobra, Watch, Sintel paused at 0:20 with a subtitle, control bar visible |
| `home` | Appearance wipe (both appearances) | Kobra, Home: Continue watching and Recently opened |
| `upnext` | Two modes stack, Kobra (back) | My videos, Up next: Sintel playing, Big Buck Bunny and Flower queued |
| `studio-media` | Two modes stack, Studio (back) | Kobra Studio, Media Studio overview |
| `featurebar-watch`, `-clips`, `-convert`, `-scenes`, `-listen`, `-insights` | Feature bar panels | Each space of Kobra's feature bar with the demo library |

## Crops (`<crop>-<theme>-<w>.webp`)

| Crop | From | Box (1440×900 window) | Files | What it frames |
|---|---|---|---|---|
| `everyday-home`, `-watch`, `-myvideos`, `-transcript`, `-tools` | `home`, `watch`, `upnext`, `transcript`, `tools` | the whole window | 760×475, 1520×950 | Everyday steps 1–5 |
| `kobra-countdown` | `countdown` | 1075, 474, 300×111 | 450×166, 900×333 | Exactly the Up next card (its 14 px corners are matched by `.stack-countdown`) |
| `kobra-transcript` | `transcript` | 1124, 104, 300×348 | 300×348, 600×696 | The Transcript panel: header, search and every line |
| `studio-timeline` | `studio-editor` | 16, 518, 884×354 | 640×256, 1280×513 | The timeline's tool row, ruler, tracks and clips (the right edge falls in the clip area, as the timeline scrolls) |
| `studio-tabs` | `studio-media` | 10, 38, 1132×48 | 960×41, 1920×81 | The Kobra/Kobra Studio switch and every workspace tab |

## Film stills (`public/assets/film/`)

Made by `npm run film` (`scripts/film.py`). The two shown large, `sintel-dragon` and `sintel-city`, are 1454×818 16:9 frames from the 1080p Sintel trailer (`captures/sintel-trailer-1080p.mp4`, Blender Foundation, CC BY 3.0); the rest come from the app's bundled samples and are shown at or below their size. The Editor section fills 9:16, 1:1 and 4:5 shapes with `sintel-city` on purpose (`data-crop="reframe"`), as the app's Fill setting does.
