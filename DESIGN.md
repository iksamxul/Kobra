# Showcase design and motion map

## Visual intent

**Editorial calm, dimensional product.** The page should feel related to Kobra before anyone reads the name: neutral surfaces, translucent glass, hairline borders, generous radii and the app's own K mark. The reference is an Apple product page in craft and pacing, in Kobra's language rather than Apple's branding.

- Pearl: `#f5f5f7` canvas, white cards, near-black ink, silver hairlines.
- Midnight: `#111113` canvas, `#1c1c1f` cards, off-white ink, graphite lines. The Editor section is always Midnight, like the app's dark workspaces.
- Glass follows the app's tokens (`studio.css`): translucent fill, white edge, a 125° reflection gradient, 18 px radius.
- Selection is the app's segmented control: a field track with a soft solid pill. One filled primary action per view.
- Headlines are large and tightly tracked (`Segoe UI Variable Display` on Windows, the system face elsewhere); captions are tiny, uppercase and letter-spaced.
- Colour comes only from the films and screens. No neon, no gradients for their own sake, no fake metrics or testimonials. Illustrated panels are labeled as illustrations.

## Page sequence

| Section | Job | Motion |
|---|---|---|
| Header | Brand, sections, appearance, Get Kobra | Frosted glass, reading-progress hairline, sliding nav pill (hover and scroll spy), magnetic button |
| Hero | The quiet-player idea, the product as an object | Pinned 240vh: headline lifts; display turns and rises; camera moves into the screen; HTML handoff; spotlight on the video and caption |
| Statement | What Kobra is, in one paragraph | Pinned: words brighten with scroll |
| Everyday | Home, Watch, My videos, Transcript, Tools | Sticky glass frame crossfades between crops (≥900 px) |
| Feature bar | The six new tabs | Pinned horizontal gallery; tab pill follows; panel micro-animations only on the active panel |
| Try it | Working previews of real behavior | Card tilt and glare, sliding segmented pill, countdown ring, transcript follow |
| Appearance | Pearl and Midnight | Pinned: clip-path frame opens, Midnight wipes across |
| Two modes | Kobra and Kobra Studio | Switch swaps a stack of screens; layers drift at three depths |
| Editor | The new Editor | Pinned CSS 3D: layers explode, razor/ripple/transition, sequence shapes, export; keyframe demo |
| Local-first | Ownership and calm | Mask-line reveal, lock tile settles |
| Questions, Download | Answers and one next step | Disclosure, 3D emblem, real release links |

## Motion rules

- Use scroll position, never accumulated wheel deltas. No smooth-scroll library, no scroll interception, no autoplaying video, no idle animation loops.
- Pinned layouts and hidden initial states exist only under `html.motion`. Reduced motion and no-JavaScript get a static page with every step present.
- Transforms, opacity and custom properties only; one rAF loop reads all rectangles, then writes.
- Three.js renders on demand, pauses offscreen and in hidden tabs, caps DPR at 2 and hands off to crisp HTML once the screen fills the viewport.
- Interactive previews start once when first seen, never loop, and stop when touched.

## Models and assets

The hero display (shell, glass, screen, sheen, hinge, neck, foot, contact shadow) and the K emblem are procedural Three.js geometry. Screens are responsive WebP pairs from `scripts/screens.py`; see `public/assets/screens/MANIFEST.md` for every image and the captures still to come.
