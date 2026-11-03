# Kobra — the showcase

A standalone, Apple-inspired product website for Kobra. The visual language comes from the app: monochrome Pearl/Midnight, soft glass, restrained borders and content-first layouts.

**Site:** https://iksamxul.github.io/Kobra/  
**Repository:** https://github.com/iksamxul/Kobra

This repository contains the website, not the desktop application's source or installers.

## Develop

Requires Node.js 22 and npm.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

Browser checks: `npx playwright install chromium`, then `npm run verify`. On Windows with Edge already installed, set `SHOWCASE_BROWSER=msedge` to use it instead. Tests exercise five widths in both themes, mode/appearance interactions, reduced motion, 3D scroll stages, WebGL fallback, keyboard navigation and the no-JavaScript page. Screenshots are written to ignored `review/screenshots/`.

Development and preview default to `http://127.0.0.1:4173`. When working in the desktop project, run these commands from its `showcase/` directory. The website has its own dependencies and build.

## What's here

- Responsive product story, substantial real-app visuals, feature cards, FAQ and release section.
- Pearl/Midnight toggle with remembered preference.
- Procedural Three.js display with metallic chassis, real screenshot texture, scroll rotation and subtle pointer response.
- Lazy WebGL loading; HTML image fallback on reduced motion or unsupported WebGL.
- Native-scroll, three-stage sticky sequence with synchronized text and screenshots.
- Interactive Kobra/Studio preview, bookmark demonstration, reveal animations and hover/press feedback.
- Reduced-motion layout that presents every story step without requiring scrolling through a pinned animation.
- Self-hosted images, system fonts, semantic content and keyboard-accessible controls.
- GitHub Pages workflow; pull requests build without deploying.

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Semantic homepage, SEO text, sections and copy |
| `credits.html` | Attribution and media licenses |
| `src/style.css` | App-inspired tokens and responsive layouts |
| `src/motion.css` | Micro-interactions, reveals and reduced-motion behavior |
| `src/main.ts` | Theme, mode preview, scroll choreography and release links |
| `src/scene.ts` | Procedural 3D model, lighting, interaction and GPU cleanup |
| `src/config.ts` | Release version/URLs and mode-specific content |
| `public/assets/` | Real app screenshots, artwork and social image |
| `.github/workflows/pages.yml` | Build and Pages deployment |
| `CLAUDE_HANDOFF.md` | Continuation prompt, design direction and completion checklist |

## Downloads

Fill `setupUrl` and `portableUrl` in `src/config.ts` with the real public **HTTPS GitHub Release asset URLs**. Empty URLs show an honest “Public download links are being prepared” message. No fake download buttons or local paths are published. Do not add large Windows executables to this website repository.

The application currently identifies itself as 2.1.0; the newest app-only Editor and additional library changes were still under review when this website was created. Homepage claims emphasize the documented two-mode release. Verify a new app release before changing claims or download URLs.

## GitHub Pages

Repository Settings → Pages → Source must be **GitHub Actions**. Pushing `main` builds `dist/` and deploys it. Relative Vite asset URLs support both a project page (`/Kobra/`) and a root user page. The workflow expects this site's package.json at repository root, as it is in the public repository.

For another domain, update metadata/canonical URLs and add a `public/CNAME` only after the domain is configured. Open Graph URLs should be absolute for social crawlers.

## Asset provenance

The WebP screens were resized to 1440 px wide from the desktop application's `review/modes/` captures (1920×1200). They depict demo data, not personal files. Asset mapping:

- `watch-dark.webp` → `dark-wide-kobra-09-watch.png`
- `tools-dark.webp` → `dark-wide-kobra-11-tools-video.png`
- `home-{light,dark}.webp` → `{light,dark}-wide-kobra-12-home-continue.png`
- `studio-{light,dark}.webp` → `{light,dark}-wide-studio-13-media-studio.png`
- `kobra.svg` → desktop `build/icon.svg`
- `sintel-poster.jpg` → desktop `public/sintel-poster.jpg`

Keep the Blender/MDN attribution in `credits.html` when replacing visuals. All models in this base are procedural geometry; there is no GLB to download.
