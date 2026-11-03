# Showcase design and motion map

## Visual intent

**Editorial calm, dimensional product.** The webpage should feel related to Kobra before someone reads the name: grayscale surfaces, translucent navigation, crisp fine borders, softly rounded windows, and the app's own K mark.

- Pearl: `#f5f5f7` canvas, white cards, near-black typography, silver borders.
- Midnight: `#111113` canvas, `#1c1c1f` cards, off-white typography, graphite borders.
- One strong action at a time. Avoid neon, rainbow backgrounds, dense badge walls and fake usage metrics.
- Headlines are deliberately large and tightly tracked; supporting copy is concise and human.
- The media itself may have color. The interface around it stays neutral.

## Page sequence

| Section | Job | Motion / interaction |
|---|---|---|
| Header | Brand, page navigation, appearance, get Kobra | Frosted sticky surface, reading-progress hairline, underline / press feedback |
| Hero | Establish the quiet-player idea | Staggered type entry; floating procedural display rotates slightly with scroll and pointer |
| Introduction | Explain the value in human language | One-time text reveals; no count-up metrics |
| Scroll story | Connect watching, practical tools and Studio | Three native-scroll stages; screen perspective and copy crossfade; progress dashes |
| Two modes | Show the actual app difference | Clickable Kobra / Studio segmented control; screenshots and copy switch together |
| Details | Make small tools feel tangible | Waveform expands on hover, subtitle indicator responds, explicit bookmark preview, layered Pearl/Midnight cards |
| Local-first | Communicate ownership and calm | Quiet lock illustration and text reveal |
| FAQ | Answer actual product questions | Native details/summary disclosure with rotating plus |
| Get Kobra | One clear next step | Real configurable release links, or honest availability message |

## Motion rules

- Use scroll position, not accumulated wheel deltas. The user owns scrolling.
- No smooth-scroll library, scroll interception, autoplay video or infinite floating animation.
- Render Three.js only while settling toward a target or reacting to scroll/pointer input.
- Keep pointer motion small enough that the screen remains readable.
- The scene is paused offscreen and when the document is hidden.
- Reduced motion gets a static product image and all three story paragraphs in normal flow.
- Content is present in semantic HTML and remains usable without JavaScript.

## Model and assets

The hero is a procedural metallic display with rounded chassis, dark bezel, screen texture and a small power button. It is an abstract product presentation, not a replica of branded hardware. All asset URLs are local and work under the GitHub Pages project path.

The first implementation uses full real-app screenshots for fidelity. A later pass can replace them with carefully staged screenshots, keeping corresponding images updated in both the HTML fallback and the WebGL screen texture.

## Useful future enhancements

1. Original sculpted K mark / glass emblem, rather than third-party hardware.
2. A restrained exploded-interface sequence tying glass layers to the app's actual UI.
3. Higher-quality app captures without upgrade hints and with release-verified content.
4. One purposeful short demo, only if there is a source clip and explicit playback control.
5. Updated social preview composed from the final hero and typography.

Keep any new feature optional for low-power devices and do not turn the entire page into a WebGL canvas.
