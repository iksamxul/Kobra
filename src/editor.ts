import { clamp, easeInOut, easeOut, motion, onScroll, range, smooth } from './scroll';

// The Editor sequence, driven only by scroll position. Four steps:
//   0.00-0.22  monitors and timeline; the playhead plays the edit
//   0.22-0.48  the program monitor explodes into its layers in 3D
//   0.48-0.74  razor at the playhead, ripple delete, a crossfade appears
//   0.74-1.00  the sequence changes shape (16:9, 9:16, 1:1, 4:5), then exports
const STEPS = [0, .22, .48, .74];
const ASPECTS = [16 / 9, 9 / 16, 1, 4 / 5];
// [progress, aspect index]: holds and moves between the four sequence shapes.
const SHAPES: [number, number][] = [[.76, 0], [.8, 1], [.835, 1], [.86, 2], [.885, 2], [.91, 3]];

function aspectAt(p: number) {
  if (p <= SHAPES[0][0]) return ASPECTS[0];
  for (let i = 1; i < SHAPES.length; i++) {
    const [end, to] = SHAPES[i], [start, from] = SHAPES[i - 1];
    if (p <= end) return ASPECTS[from] + (ASPECTS[to] - ASPECTS[from]) * easeInOut(range(p, start, end));
  }
  return ASPECTS[3];
}

function sequence() {
  const run = document.querySelector<HTMLElement>('.editor-run');
  if (!run) return;
  const scene = run.querySelector<HTMLElement>('.ed-scene')!;
  const steps = [...run.querySelectorAll<HTMLElement>('.ed-step')];
  const chips = [...run.querySelectorAll<HTMLElement>('.ed-aspects i')];
  const exportLabel = run.querySelector<HTMLElement>('.ed-export span')!;
  const list = run.querySelector<HTMLElement>('.ed-steps')!;
  let step = -1, chip = 0, saved = false;
  const set = (name: string, value: number | string) => scene.style.setProperty(name, typeof value === 'number' ? value.toFixed(4) : value);
  onScroll(run, 'pin', p => {
    const next = STEPS.reduce((found, start, i) => (p >= start ? i : found), 0);
    if (next !== step) {
      step = next;
      steps.forEach((element, i) => element.classList.toggle('is-active', i === next));
    }
    list.style.setProperty('--edp', p.toFixed(4));
    // Layers: the window turns and the program's planes separate in depth.
    const explode = smooth(range(p, .24, .34)) * (1 - smooth(range(p, .42, .5)));
    set('--ex', explode);
    set('--dim', explode);
    set('--wry', `${(explode * -34).toFixed(3)}deg`);
    set('--wrx', `${(explode * 18).toFixed(3)}deg`);
    set('--ws', 1 - explode * .16);
    set('--focus', smooth(range(p, .48, .52)) * (1 - smooth(range(p, .72, .76))));
    // Cut: the playhead stops at 38%, the razor splits Meadow, the tail goes, the rest closes up.
    const playhead = p < .22 ? range(p, 0, .2) * 30 : p < .48 ? 30 + range(p, .22, .46) * 4 : p < .74 ? 34 + easeInOut(range(p, .48, .53)) * 4 : 38 + range(p, .74, .98) * 44;
    set('--ph', playhead);
    set('--razor', range(p, .52, .55) * (1 - range(p, .6, .63)));
    set('--cut', range(p, .54, .56));
    set('--del', range(p, .58, .62));
    set('--ripple', easeInOut(range(p, .62, .67)));
    set('--trans', easeOut(range(p, .68, .72)));
    // Shape: the program canvas morphs between sequence shapes inside a 16:10 stage.
    const aspect = aspectAt(p);
    set('--cw', `${(aspect >= 1.6 ? 100 : aspect / 1.6 * 100).toFixed(2)}%`);
    set('--ch', `${(aspect >= 1.6 ? 1.6 / aspect * 100 : 100).toFixed(2)}%`);
    const nearest = ASPECTS.reduce((best, value, i) => (Math.abs(value - aspect) < Math.abs(ASPECTS[best] - aspect) ? i : best), 0);
    if (nearest !== chip) { chip = nearest; chips.forEach((element, i) => element.classList.toggle('on', i === nearest)); }
    const exported = range(p, .93, .985);
    set('--exp', exported);
    if ((exported >= 1) !== saved) { saved = exported >= 1; exportLabel.textContent = saved ? 'Saved on this device' : 'Export MP4'; }
  }, { reset: () => scene.removeAttribute('style') });
  // With motion off every step is listed; the window shows the finished edit.
  if (!motion()) steps.forEach(element => element.classList.add('is-active'));
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
