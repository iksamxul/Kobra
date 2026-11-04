# Claude Opus 5.5 — continue the Kobra showcase

## User's direction

> Build a proper showcase webpage hosted on my github.io with an Apple design look and lots of animations and micro-animations. Incorporate 3D models and visuals for a nice scrollable animation. Make sure the color scheme and design follow the app's design language.

## Working implementation

The base lives at repository root in `iksamxul/Kobra`, or under `showcase/` when opened from the desktop application's folder. Read `README.md`. This is a real static Vite/TypeScript/Three.js site, not a mockup or a video composition.

Keep the current direction: **quiet, editorial, premium**. Pearl white and silver; Midnight charcoal and graphite. Large tightly tracked headlines, generous space, tiny technical captions, rounded glass surfaces. Content and real app screens supply the visual interest. Apple-inspired restraint, not copied Apple branding or product assets.

### Already implemented

- "Kobra, expanded" bento: the My videos panel capture plus working previews of Up next, picture modes (the app's exact factors), transcript, open folder and history.
- Editor sequence: exploded glass layers; clips gather from Segments, Moments and Shots into one timeline, the playhead splits a clip, the outputs appear.
- 3D Kobra emblem in the download section, extruded from the logo path, lazy-loaded with the SVG as fallback.

- Hero with real app screenshot on a procedural 3D metallic display, lazy-loaded as a separate chunk. Scroll and pointer move the display, with no idle animation loop.
- Sticky, three-stage native-scroll story: settle in → make it yours → go deeper.
- Working Kobra/Studio preview and Pearl/Midnight theme switch.
- Feature cards with a waveform, subtitle timing treatment, bookmark demo and dimensional appearance illustration.
- Local-first section, expandable FAQ, configurable download section and attribution page.
- Responsive layouts, focus styles, reduced-motion alternatives, visible image fallback, GPU disposal, and no third-party analytics/fonts.
- GitHub Pages workflow for `main`, PR builds and release URLs kept in `src/config.ts`.

## Continue from here

1. Run the site and inspect it at desktop, tablet and phone sizes before editing. Review the actual app design if its source/screenshots are available.
2. Refine the 3D product choreography. A custom Kobra logo model or an exploded glass-interface sequence could add a signature moment; keep it legible and lightweight. Preserve a useful non-WebGL fallback.
3. Refine section pacing, screen crops, typography and micro-interactions. Motion should explain an interaction or direct attention, not compete with the video content. Use native scrolling; do not hijack wheel or touch input.
4. Prefer real current app screenshots to drawn mock interfaces. The supplied screens include demo data. Remove obsolete screenshots only after replacements are verified.
5. The Editor and MP4 export are verified in the desktop build (`npm run test:render` in the app renders a two-video edit to a playable 1280×720 MP4; it needs network once for the FFmpeg core). Do not claim universal codec support, AI sound separation, automatic transcription (the transcript comes from subtitle files) or full PotPlayer parity.
6. Configure download links only after real public application release assets exist. Do not turn “Get Kobra” into a dead link or upload app executables to git.
7. Verify keyboard use, reduced motion, touch, no-WebGL, missing image fallback, both themes and both mode previews. Keep all three scroll-story paragraphs visible in the reduced-motion layout.
8. Run `npm run build`. Check the production build, including credits and asset paths under `/Kobra/`. Inspect console/network errors and screenshots at 1440, 1024, 768, 390 and 320 px widths.
9. Push verified changes to the existing repository, let the Pages workflow deploy, and check the actual live site. Do not replace other GitHub Pages projects.

## File ownership / extension points

- Product copy and semantic sections: `index.html`.
- Visual tokens, responsive layout: `src/style.css`.
- Motion rules and reduced-motion overrides: `src/motion.css`.
- Theme, mode toggle, scroll stage and interaction state: `src/main.ts`.
- Three.js objects, lights, textures, camera, render scheduling: `src/scene.ts`.
- Real release URLs and mode copy: `src/config.ts`.

The scene is a geometry-based floating screen, **not a pre-existing glTF/GLB model**. More elaborate models can be added later, with documented licenses, loading budgets and disposal. Keep Three.js lazy-loaded and cap device pixel ratio. Avoid continuous rendering when the scene is offscreen or the page is hidden.

## Completion bar

Make it feel like a finished product story, not a pile of effects. Every CTA works or accurately reports availability; every claim corresponds to the app. Both themes remain monochrome and accessible. The phone layout feels intentional. Publish the tested site and report the real URL, checks and any remaining work.
