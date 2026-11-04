import { clamp, motion, onScroll, range } from './scroll';

// The Editor sequence: real captures of Kobra Studio's Editor (public/assets/screens/editor-*-dark,
// 1440x900 windows), driven only by scroll. Each step has beats; a beat names the capture on
// screen and the region the highlight outlines. Regions are CSS pixels of the 1440x900 window,
// recorded by the app's site capture (electron/review-site.cjs -> captures/editor-rects.json).
type Rect = [number, number, number, number];
const WINDOW = [1440, 900];
const SOURCE: Rect = [337, 157, 531, 313], PROGRAM: Rect = [875, 146, 548, 329], TIMELINE: Rect = [17, 516, 1406, 355];
const SIDE: Rect = [17, 146, 309, 370], TRACKS: Rect = [17, 586, 1406, 136], TOOLS: Rect = [17, 517, 470, 47];
const MEADOW: Rect = [433, 682, 384, 35], SHAPE: Rect = [109, 366, 194, 34], EXPORT: Rect = [1021, 151, 390, 566];
const BEATS: { shot: string; rect: Rect }[][] = [
  [{ shot: 'editor', rect: SOURCE }, { shot: 'editor', rect: PROGRAM }, { shot: 'editor', rect: TIMELINE }],
  [{ shot: 'editor-layers', rect: TRACKS }, { shot: 'editor-layers', rect: SIDE }],
  [{ shot: 'editor-cut', rect: TOOLS }, { shot: 'editor-cut', rect: MEADOW }, { shot: 'editor-cut', rect: SIDE }],
  [{ shot: 'editor-inspector', rect: MEADOW }, { shot: 'editor-inspector', rect: SIDE }],
  [{ shot: 'editor-shape', rect: SHAPE }, { shot: 'editor-shape', rect: PROGRAM }, { shot: 'editor-export', rect: EXPORT }],
];
const PAD = 6;

function sequence() {
  const run = document.querySelector<HTMLElement>('.editor-run');
  if (!run) return;
  const steps = [...run.querySelectorAll<HTMLElement>('.ed-step')];
  const shots = [...run.querySelectorAll<HTMLImageElement>('.ed-shot')];
  const focus = run.querySelector<HTMLElement>('.ed-focus')!;
  const list = run.querySelector<HTMLElement>('.ed-steps')!;
  let shown = '', step = -1;
  const show = (shot: string) => {
    if (shot === shown) return;
    shown = shot;
    // Only the capture on screen is announced; the others are hidden from assistive tech.
    shots.forEach(img => { const on = img.dataset.shot === shot; img.classList.toggle('is-active', on); img.toggleAttribute('aria-hidden', !on); });
  };
  const update = (p: number) => {
    const index = Math.min(BEATS.length - 1, Math.floor(p * BEATS.length));
    const beats = BEATS[index];
    const local = clamp(p * BEATS.length - index);
    const beat = beats[Math.min(beats.length - 1, Math.floor(local * beats.length))];
    if (index !== step) { step = index; steps.forEach((element, i) => element.classList.toggle('is-active', i === index)); }
    show(beat.shot);
    const [x, y, w, h] = beat.rect;
    focus.style.setProperty('--fx', ((x - PAD) / WINDOW[0]).toFixed(4));
    focus.style.setProperty('--fy', ((y - PAD) / WINDOW[1]).toFixed(4));
    focus.style.setProperty('--fw', ((w + PAD * 2) / WINDOW[0]).toFixed(4));
    focus.style.setProperty('--fh', ((h + PAD * 2) / WINDOW[1]).toFixed(4));
    list.style.setProperty('--edp', range(p, 0, 1).toFixed(4));
  };
  const reset = () => { steps.forEach(element => element.classList.add('is-active')); shots.forEach(img => img.removeAttribute('aria-hidden')); shown = ''; step = -1; };
  onScroll(run, 'pin', update, { reset });
  // Load every capture a little before the section arrives, so no step starts on a blank frame.
  new IntersectionObserver((entries, observer) => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    shots.forEach(img => { img.loading = 'eager'; });
  }, { rootMargin: '150% 0px' }).observe(run);
  if (!motion()) reset();
}

// Keyframes: four properties, each between two keys, with a choice of easing.
const easings = {
  linear: (t: number) => t,
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  inout: (t: number) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};
type Easing = keyof typeof easings;
const DURATION = 2400;

function keyframes() {
  const demo = document.querySelector<HTMLElement>('.kf-demo');
  if (!demo) return;
  const title = demo.querySelector<HTMLElement>('.kf-title')!;
  const lanes = demo.querySelector<HTMLElement>('.kf-lanes')!;
  const time = demo.querySelector<HTMLElement>('.kf-time')!;
  const scrub = demo.querySelector<HTMLInputElement>('.kf-scrub')!;
  const play = demo.querySelector<HTMLButtonElement>('.kf-play')!;
  const curve = demo.querySelector<SVGPathElement>('.kf-curve path')!;
  const dot = demo.querySelector<SVGCircleElement>('.kf-curve circle')!;
  const keys = [...demo.querySelectorAll<HTMLElement>('.kf-lane')].map(lane => [Number(lane.style.getPropertyValue('--a')), Number(lane.style.getPropertyValue('--b'))]);
  let easing: Easing = 'out', t = 1, frame = 0, started = 0, from = 0;

  const drawCurve = () => {
    const ease = easings[easing];
    curve.setAttribute('d', Array.from({ length: 25 }, (_, i) => `${i ? 'L' : 'M'}${(2 + i / 24 * 56).toFixed(1)} ${(38 - ease(i / 24) * 36).toFixed(1)}`).join(' '));
  };
  const apply = (value: number) => {
    t = clamp(value);
    const ease = easings[easing];
    const [position, scale, rotation, opacity] = keys.map(([a, b]) => ease(range(t, a, b)));
    title.style.setProperty('--kx', `${((1 - position) * -60).toFixed(2)}%`);
    title.style.setProperty('--ky', `${((1 - position) * 40).toFixed(2)}%`);
    title.style.setProperty('--ks', (.6 + scale * .4).toFixed(4));
    title.style.setProperty('--kr', `${((1 - rotation) * -10).toFixed(2)}deg`);
    title.style.setProperty('--ko', opacity.toFixed(3));
    lanes.style.setProperty('--t', t.toFixed(4));
    time.textContent = `0:0${(t * DURATION / 1000).toFixed(1)}`;
    scrub.value = String(Math.round(t * 1000));
    const local = range(t, keys[0][0], keys[0][1]);
    dot.setAttribute('cx', (2 + local * 56).toFixed(1));
    dot.setAttribute('cy', (38 - ease(local) * 36).toFixed(1));
  };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; demo.classList.remove('is-playing'); play.setAttribute('aria-label', 'Play the animation'); };
  const tick = (now: number) => {
    const value = from + (now - started) / DURATION;
    apply(value);
    if (value < 1) frame = requestAnimationFrame(tick); else stop();
  };
  const start = () => {
    // With reduced motion the result is shown at once; scrubbing still works.
    if (!motion()) { apply(1); return; }
    from = t >= 1 ? 0 : t;
    started = performance.now();
    demo.classList.add('is-playing');
    play.setAttribute('aria-label', 'Pause the animation');
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(tick);
  };
  play.addEventListener('click', () => (frame ? stop() : start()));
  scrub.addEventListener('input', () => { stop(); apply(Number(scrub.value) / 1000); });
  demo.querySelectorAll<HTMLButtonElement>('[data-ease]').forEach(button => button.addEventListener('click', () => {
    easing = button.dataset.ease as Easing;
    demo.querySelectorAll('[data-ease]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    drawCurve();
    apply(t);
    start();
  }));
  drawCurve();
  apply(1);
  // Plays once when first seen, never in a loop.
  new IntersectionObserver((entries, observer) => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    if (motion()) { apply(0); start(); }
  }, { threshold: .6 }).observe(demo);
}

export function initEditor() { sequence(); keyframes(); }
