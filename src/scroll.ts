// One requestAnimationFrame loop for every scroll-driven scene. Each frame reads all the
// rectangles first and then lets scenes write, so scrolling never forces extra layouts.
// Scenes only map the native scroll position to progress; they never move the page.

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
/** 0 before `a`, 1 after `b`, linear between. */
export const range = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
/** True when pinned, scroll-driven layouts are active (JS on and motion allowed). */
export const motion = () => document.documentElement.classList.contains('motion');

/**
 * pin:   0 when the element's top reaches the viewport top, 1 when its bottom reaches the
 *        viewport bottom (the span a sticky child stays pinned).
 * view:  0 when the top enters at the bottom of the viewport, 1 when the bottom leaves at the top.
 * enter: 0 when the top enters at the bottom, 1 once the top is 35% from the top.
 */
type Kind = 'pin' | 'view' | 'enter';
interface Options { measure?: () => void; reset?: () => void; always?: boolean }
interface Scene extends Options { element: Element; kind: Kind; update: (progress: number, rect: DOMRect) => void; last: number }

const scenes: Scene[] = [];
let frame = 0, stale = true;
// Pinned sections are sized in viewport units, so a resize moves every scroll position.
// The pinned scene being read is remembered before the resize and its progress restored.
let anchor: { scene: Scene; progress: number } | null = null;

export function onScroll(element: Element, kind: Kind, update: Scene['update'], options: Options = {}) {
  scenes.push({ element, kind, update, last: NaN, ...options });
  stale = true;
  schedule();
}

/** Re-measure every scene and redraw, e.g. after fonts load or the layout mode changes. */
export function refresh() { stale = true; schedule(); }

function schedule() { if (!frame) frame = requestAnimationFrame(run); }

function run() {
  frame = 0;
  const animated = motion();
  if (stale) {
    stale = false;
    for (const scene of scenes) { scene.last = NaN; if (animated || scene.always) scene.measure?.(); }
    if (anchor && animated) {
      const { scene, progress } = anchor;
      const rect = scene.element.getBoundingClientRect();
      const top = scrollY + rect.top + progress * Math.max(1, rect.height - innerHeight);
      if (Math.abs(top - scrollY) > 1) scrollTo({ top, behavior: 'instant' });
    }
    anchor = null;
  }
  const vh = innerHeight;
  const active = scenes.filter(scene => animated || scene.always);
  const rects = active.map(scene => scene.element.getBoundingClientRect());
  active.forEach((scene, i) => {
    const rect = rects[i];
    const progress = scene.kind === 'pin' ? clamp(-rect.top / Math.max(1, rect.height - vh))
      : scene.kind === 'view' ? clamp((vh - rect.top) / (vh + rect.height))
      : clamp((vh - rect.top) / (vh * .65));
    if (progress === scene.last) return;
    scene.last = progress;
    scene.update(progress, rect);
  });
}

window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', () => {
  // Resize events run before this frame's scroll events, so `last` is still the old progress.
  if (!anchor) {
    const scene = scenes.find(item => item.kind === 'pin' && item.last > 0 && item.last < 1);
    if (scene) anchor = { scene, progress: scene.last };
  }
  refresh();
});
reducedMotion.addEventListener('change', () => {
  document.documentElement.classList.toggle('motion', !reducedMotion.matches);
  if (reducedMotion.matches) scenes.forEach(scene => scene.reset?.());
  refresh();
});
document.fonts?.ready.then(refresh);
window.addEventListener('load', refresh);
