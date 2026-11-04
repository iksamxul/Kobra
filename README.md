# Kobra — the showcase

A standalone product website for Kobra in the app's own visual language: monochrome Pearl/Midnight, soft glass, hairline borders, large tightly tracked type, colour only from the media. Scroll-driven 3D and motion, built on native scrolling.

**Site:** https://iksamxul.github.io/Kobra/  
**Repository:** https://github.com/iksamxul/Kobra

This repository contains the website, not the desktop application's source or installers.

## Develop

Requires Node.js 22 and npm. Python 3 with Pillow is only needed to regenerate images.

```sh
npm ci
npm run dev        # http://127.0.0.1:4173 (add --port to change it)
npm run build      # tsc + vite build into dist/
npm run preview
npm run screens    # captures/ (4320x2700) -> WebP screens and crops; never upscales or forces an aspect
npm run film       # sample-film stills (needs ffmpeg and the desktop app's public/ folder)
```

Browser checks: `npx playwright install chromium`, then `npm run verify`. On Windows with Edge installed, set `SHOWCASE_BROWSER=msedge`. The suite covers five widths in both themes (static layout, every working preview, image loading, no horizontal overflow), the full motion path (WebGL hero, each scroll story, theme persistence), the WebGL fallback, the no-JavaScript page, keyboard use and the release links. Section screenshots for review: `node tests/capture.mjs http://127.0.0.1:4173/ 1440 dark` writes to ignored `review/sections/`. Scroll cost: `node tests/perf.mjs http://127.0.0.1:4173/` scrolls the whole page in Edge and reports frame-time percentiles and any long animation frames. Image quality: `node tests/image-audit.mjs http://127.0.0.1:4173/` checks every image at 1440@2x, 1920@1x, 1024@2x and 390@3x and fails if one is drawn larger than its pixels, stretched or cropped (rules in `public/assets/screens/MANIFEST.md`).

## The page

| Section | What moves |
|---|---|
| Hero | Pinned. A procedural aluminium display (Three.js) turns to face you and rises; the camera moves in until the screen covers the viewport; the HTML screenshot takes over; everything but the video dims under a caption. Without WebGL the CSS display does the same. |
| Statement | Pinned. Words brighten one by one with scroll. |
| Everyday | A list of five features beside a sticky glass frame that crossfades between tight crops (wide screens). |
| Feature bar | Pinned. Vertical scroll moves a gallery of six panels sideways; a segmented tab bar follows and can jump to a panel. |
| Try it | Working previews: Up next countdown, picture modes (the app's own factors), transcript, moments, open folder, history. Cards tilt with a glare. |
| Appearance | Pinned. The frame opens (clip-path), then Midnight wipes across Pearl. |
| Two modes | Kobra / Kobra Studio switch; each stack of screens drifts at different depths. |
| Editor | Pinned, CSS 3D. Monitors and a multi-track timeline; the program monitor explodes into its layers; razor, ripple delete and a transition; the sequence changes shape and exports. Then an interactive keyframe demo and the capability grid. |
| Local-first, questions, download | Lines rise out of masks; the 3D K emblem; real release links. |

Micro-interactions: magnetic primary buttons, a sliding nav indicator that follows hover and the section you are reading, sliding segmented thumbs, an animated appearance icon and a circular appearance reveal (View Transitions), focus rings throughout.

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Semantic page, static copy and the no-JavaScript layout |
| `src/content.ts` | **Claims to verify**: all copy for the feature bar and the new Editor, and their FAQ answers |
| `src/content-html.ts` | Renders `content.ts` into `<!--content:…-->` markers (via the plugin in `vite.config.ts`) |
| `src/config.ts` | Release version and URLs; Kobra / Studio mode copy |
| `src/scroll.ts` | One rAF loop for all scroll scenes; progress helpers; the `motion` switch |
| `src/hero.ts`, `src/scene.ts` | Hero choreography; the Three.js display (lazy chunk) |
| `src/story.ts` | Statement, Everyday, feature bar gallery, appearance wipe, mode stack, mask lines |
| `src/editor.ts` | Editor sequence and the keyframe demo |
| `src/sections.ts` | Working previews in Try it |
| `src/interactions.ts` | Segmented thumbs, nav indicator, magnetic buttons, card tilt |
| `src/images.ts` | Theme-aware `srcset` switching; the hero texture URL |
| `src/emblem.ts` | 3D Kobra emblem in the download section |
| `src/style.css`, `features.css`, `sections.css`, `editor.css`, `motion.css` | Tokens and layouts; feature bar; previews; Editor; micro-interactions and reveals |
| `scripts/screens.py`, `scripts/screens.json` | Capture conversion and the list of screens and crops |
| `scripts/film.py` | Stills from the sample films |
| `public/assets/screens/` | Generated screens and crops, plus `MANIFEST.md` |
| `public/assets/film/` | Sample-film stills (CC BY 3.0 / CC0, see `credits.html`) |
| `tests/` | Playwright suite and the section capture script |

## Motion rules

- `html.motion` is set before first paint when JavaScript runs and reduced motion is off. Pinned, scroll-driven layouts and initial hidden states exist only under it, so reduced motion and no-JavaScript get a complete static page with every step in normal flow.
- Scenes map native scroll position to progress and write custom properties; nothing intercepts wheel or touch. Reads happen before writes in a single rAF.
- Three.js loads as a separate chunk when the hero or emblem comes near, renders on demand (never idle), pauses offscreen and in hidden tabs, caps device pixel ratio at 2 and disposes on navigation. The hero stops rendering once the HTML screen has taken over.

## Images

Every app screen is a pair of WebPs, `<name>-1440.webp` and `<name>-2880.webp`, used through `srcset`/`sizes`; feature crops are cut from the full-size capture at 1x and 2x of their CSS size. The hero's WebGL texture is the 2880 file with mipmaps and maximum anisotropy, and the light or dark file is preloaded as the LCP image.

`scripts/screens.py` turns full-size PNG captures into those files. For each name it uses `captures/<name>.png` (2880×1800 captures; ignored by git) and otherwise falls back to the interim 1920×1200 capture listed in `scripts/screens.json`, from the desktop project's `review/modes/`. It reports every file that had to be enlarged. **All current screens are interim and enlarged at 2x.** `public/assets/screens/MANIFEST.md` lists every screen and crop with the app state it should show, including the feature-bar screens that do not exist yet.

```sh
python scripts/screens.py                     # everything
python scripts/screens.py --only everyday     # names containing "everyday"
python scripts/screens.py --captures D:/caps  # another capture folder
```

## Claims and releases

Copy for the feature bar and the Editor lives only in `src/content.ts`. `upcoming.show` puts a "Coming in the next update" badge on those sections; it is false because the linked download (1.0.0) contains them. Turn it on only for copy that runs ahead of the linked release. Set `capture: true` per tab once its screenshots exist.

Version 1.0.0 is published at https://github.com/iksamxul/Kobra/releases/tag/v1.0.0 (the only release; an earlier 2.1.0 preview, from when development builds were numbered 2.x, was removed), and `setupUrl`, `portableUrl` and `notesUrl` in `src/config.ts` point at it; the same links are in `index.html` for the no-JavaScript page. For a new release, upload the verified installers to a new GitHub Release and update both places. Empty URLs show an honest "Public download links are being prepared" message. Do not add Windows executables to this repository.

## GitHub Pages

Repository Settings → Pages → Source must be **GitHub Actions**. Pushing `main` builds `dist/` and deploys it; pull requests build and test without deploying. Relative URLs support both a project page (`/Kobra/`) and a root user page. For another domain, update the canonical and Open Graph URLs and add `public/CNAME` once the domain is configured.

## Asset provenance

Screens are generated from the desktop app's demo-profile captures (no personal files). Film stills come from the app's bundled sample media via `scripts/film.py`: Sintel and Big Buck Bunny (© Blender Foundation, CC BY 3.0) and the MDN flower clip (CC0). `kobra.svg` is the app icon. Keep the attribution in `credits.html` when replacing visuals. All 3D models are procedural; there is no GLB.
