# Continue the Kobra showcase

## User's direction

> Build a proper showcase webpage hosted on my github.io with an Apple design look and lots of animations and micro-animations. Incorporate 3D models and visuals for a nice scrollable animation. Make sure the color scheme and design follow the app's design language.

Verdict on the first version: "the images on the site are extremely low res and the website is not on par with the prompt." The rebuild targets an Apple product page in craft and motion, in Kobra's own language.

## Where things stand

Read `README.md` (structure, scripts, rules) and `DESIGN.md` (visual intent, motion map). The page is a static Vite/TypeScript/Three.js site:

- Pinned hero with a procedural aluminium display; the camera moves into the screen and hands off to the HTML screenshot.
- Word-by-word statement, sticky Everyday frame, horizontal feature-bar gallery, clip-path appearance wipe, parallax mode stacks, a CSS 3D exploded Editor with a keyframe demo, mask-line reveals, the 3D emblem.
- Working previews (Up next, picture modes, transcript, moments, folder, history), magnetic primaries, tilt and glare, sliding nav and segmented pills, View Transition theme switch.
- Responsive 1440/2880 WebP screens and 1x/2x crops from `scripts/screens.py`.

## Open items

1. **Captures.** Every screen is interim (1920×1200 enlarged). Produce the 2880×1800 captures in `public/assets/screens/MANIFEST.md`, drop them in `captures/`, run `npm run screens`, then check `node tests/capture.mjs`.
2. **Feature bar.** When its screens exist, set `capture: true` per tab in `src/content.ts`. Verify every claim in that file against the shipped app; it is the only place the new features are described.
3. **Release.** Downloads point at v2.1.0, which does not include the feature bar or the new Editor; `upcoming.show` keeps the "Coming in the next update" badge on those sections. When a release with them is published, update `src/config.ts`, the static links in `index.html`, and set `upcoming.show` to false.
4. Do not claim universal codec support, AI sound separation or automatic transcription (the transcript comes from subtitle files).

## Completion bar

Every CTA works or honestly reports availability; every claim corresponds to the app; both themes stay monochrome and accessible; reduced motion and no-JavaScript show every step; `npm run verify` passes at 1440, 1024, 768, 390 and 320 px in both themes.
