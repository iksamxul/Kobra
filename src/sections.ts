import './sections.css';

// Working previews for the newer Kobra features. Each mirrors the app's behavior and
// settles to a complete, readable state with reduced motion or without JavaScript.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const base = import.meta.env.BASE_URL;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const smooth = (a: number, b: number, t: number) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };

export function themedImages(theme: 'light' | 'dark') {
  document.querySelectorAll<HTMLImageElement>('[data-themed]').forEach(image => { image.src = `${base}assets/${image.dataset.themed}-${theme}.webp`; });
}

// Up next: a five-second countdown you can cancel, as at the end of a video in the app.
function upNext() {
  const demo = document.querySelector<HTMLElement>('.countdown-demo');
  if (!demo) return;
  const number = demo.querySelector('.countdown-number')!, label = demo.querySelector('.countdown-label')!, status = document.querySelector('#countdown-status')!;
  const buttons = { play: demo.querySelector<HTMLButtonElement>('[data-countdown=play]')!, cancel: demo.querySelector<HTMLButtonElement>('[data-countdown=cancel]')!, replay: demo.querySelector<HTMLButtonElement>('[data-countdown=replay]')! };
  let timer = 0, left = 5, touched = false;
  const finish = (state: 'played' | 'cancelled') => {
    clearInterval(timer);
    const ring = demo.querySelector<SVGCircleElement>('.ring-fill')!;
    if (state === 'cancelled') demo.style.setProperty('--ring', getComputedStyle(ring).strokeDashoffset);
    demo.dataset.state = state;
    label.textContent = state === 'played' ? 'Now playing' : 'Cancelled at';
    if (state === 'played') { number.textContent = ''; demo.style.setProperty('--ring', '100'); }
    buttons.play.hidden = buttons.cancel.hidden = true; buttons.replay.hidden = false;
    status.textContent = state === 'played' ? 'Preview: Big Buck Bunny is playing. Up next moves on to the following video.' : 'Preview: countdown cancelled. The video stays where it ended.';
  };
  const start = () => {
    clearInterval(timer); left = 5;
    demo.dataset.state = 'idle'; demo.style.setProperty('--ring', '0');
    label.textContent = 'Up next in'; number.textContent = '5';
    buttons.play.hidden = buttons.cancel.hidden = false; buttons.replay.hidden = true;
    status.textContent = 'INTERACTION PREVIEW';
    if (reducedMotion.matches) return;
    requestAnimationFrame(() => requestAnimationFrame(() => { demo.dataset.state = 'running'; demo.style.setProperty('--ring', '100'); }));
    timer = window.setInterval(() => { left -= 1; if (left > 0) number.textContent = String(left); else finish('played'); }, 1000);
  };
  buttons.play.addEventListener('click', () => { touched = true; finish('played'); });
  buttons.cancel.addEventListener('click', () => { touched = true; finish('cancelled'); });
  buttons.replay.addEventListener('click', () => { touched = true; start(); buttons.cancel.focus(); });
  // Starts once, when the card is first seen and only if nobody has used it yet; never a loop.
  const seen = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { seen.disconnect(); if (!touched) start(); } }, { threshold: .6 });
  seen.observe(demo);
}

// Picture modes use the app's exact brightness, contrast and saturation factors.
const pictureModes = {
  standard: { detail: 'As the video was made.', filter: 'none' },
  vivid: { detail: 'Richer colour and contrast for dull or washed-out videos.', filter: 'brightness(1.03) contrast(1.12) saturate(1.28)' },
  cinema: { detail: 'Slightly deeper and softer colour for films.', filter: 'brightness(.96) contrast(1.08) saturate(.9)' },
  soft: { detail: 'Dimmer and gentler for late-night watching.', filter: 'brightness(.82) contrast(.92) saturate(.85)' },
};
function pictures() {
  const frame = document.querySelector<HTMLElement>('.picture-frame');
  if (!frame) return;
  document.querySelectorAll<HTMLButtonElement>('[data-picture]').forEach(button => button.addEventListener('click', () => {
    const mode = pictureModes[button.dataset.picture as keyof typeof pictureModes];
    document.querySelectorAll('[data-picture]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    frame.style.setProperty('--look', mode.filter);
    document.querySelector('#picture-detail')!.textContent = mode.detail;
  }));
}

// Transcript: lines follow a short playback pass, any line jumps there, search filters.
function transcript() {
  const list = document.querySelector<HTMLElement>('.transcript-list');
  if (!list) return;
  const lines = [...list.querySelectorAll<HTMLButtonElement>('button')];
  const progress = document.querySelector<HTMLElement>('.transcript-progress')!;
  let timer = 0;
  const select = (index: number) => {
    lines.forEach((line, i) => { if (i === index) line.setAttribute('aria-current', 'true'); else line.removeAttribute('aria-current'); });
    progress.style.setProperty('--t', String((index + 1) / lines.length));
  };
  let touched = false;
  lines.forEach((line, index) => line.addEventListener('click', () => { touched = true; clearInterval(timer); select(index); }));
  document.querySelector<HTMLInputElement>('.mini-search input')!.addEventListener('input', event => {
    clearInterval(timer);
    touched = true;
    const query = (event.target as HTMLInputElement).value.trim().toLowerCase();
    lines.forEach(line => { line.parentElement!.hidden = !!query && !line.textContent!.toLowerCase().includes(query); });
  });
  select(0);
  if (reducedMotion.matches) return;
  const seen = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    seen.disconnect();
    if (touched) return;
    let index = 0;
    timer = window.setInterval(() => { index += 1; if (index >= lines.length) { clearInterval(timer); return; } select(index); }, 1700);
  }, { threshold: .6 });
  seen.observe(list);
}

// Editor: gather → shape → send, driven only by the page's scroll position.
function editor() {
  const section = document.querySelector<HTMLElement>('#editor');
  if (!section) return () => undefined;
  const stage = section.querySelector<HTMLElement>('.editor-stage')!;
  const clips = [...section.querySelectorAll<HTMLElement>('.tl-clip')];
  const exports = [...section.querySelectorAll<HTMLElement>('.editor-exports span')];
  const steps = [...section.querySelectorAll<HTMLElement>('.editor-step')];
  const dots = [...section.querySelectorAll<HTMLElement>('.editor-dots span')];
  const time = section.querySelector<HTMLElement>('.tl-time')!;
  const track = section.querySelector<HTMLElement>('.tl-track')!;
  let origins: { x: number; y: number }[] = [];
  // Offsets from each clip to its source label, measured in the untransformed layout.
  const offsetIn = (element: HTMLElement) => { let x = 0, y = 0, node: HTMLElement | null = element; while (node && node !== stage) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent as HTMLElement | null; } return { x, y }; };
  const measure = () => {
    origins = clips.map(clip => {
      const source = section.querySelector<HTMLElement>(`[data-source="${clip.dataset.from}"]`)!;
      const from = offsetIn(source), to = offsetIn(clip);
      return { x: from.x + source.offsetWidth / 2 - (to.x + clip.offsetWidth / 2), y: from.y + source.offsetHeight + 8 - to.y };
    });
  };
  const apply = (progress: number) => {
    const still = reducedMotion.matches;
    const p = still ? 1 : progress;
    const step = still ? -1 : Math.min(2, Math.floor(p * 3));
    steps.forEach((el, i) => { el.classList.toggle('is-active', still || i === step); el.setAttribute('aria-hidden', String(!still && i !== step)); });
    dots.forEach((el, i) => el.classList.toggle('is-active', i === step));
    const explode = smooth(.02, .2, p) * (1 - smooth(.72, .94, p));
    stage.style.setProperty('--explode', explode.toFixed(3));
    stage.style.setProperty('--ry', `${(-16 + p * 14).toFixed(2)}deg`);
    stage.style.setProperty('--rx', `${(9 - p * 6).toFixed(2)}deg`);
    // Gather: clips travel from their sources into the track, one after another.
    const gather = clamp((p - .04) / .28);
    stage.style.setProperty('--so', (smooth(0, .08, p) * (1 - smooth(.3, .38, p))).toFixed(3));
    clips.forEach((clip, i) => {
      const t = ease(gather * 1.5 - i * .12), origin = origins[i] || { x: 0, y: 0 };
      clip.style.setProperty('--x', `${(origin.x * (1 - t)).toFixed(1)}px`);
      clip.style.setProperty('--y', `${(origin.y * (1 - t)).toFixed(1)}px`);
      clip.style.setProperty('--r', `${((i % 2 ? 7 : -7) * (1 - t)).toFixed(2)}deg`);
      clip.style.setProperty('--o', clamp(t * 3).toFixed(3));
    });
    // Shape: the playhead plays the edit; one clip splits where it passes.
    const shape = clamp((p - .36) / .3);
    track.style.setProperty('--ph', `${(shape * 100).toFixed(2)}%`);
    track.style.setProperty('--pho', (smooth(.33, .38, p) * (1 - smooth(.7, .76, p))).toFixed(3));
    const cut = smooth(.42, .5, p);
    track.style.setProperty('--cut', (cut * (1 - smooth(.58, .64, p))).toFixed(3));
    track.style.setProperty('--split', `${(-4 + smooth(.5, .6, p) * 4).toFixed(2)}px`);
    const seconds = Math.round(still ? 0 : shape * 25);
    time.textContent = `0:${String(seconds).padStart(2, '0')} / 0:25`;
    // Send: every output appears in turn.
    exports.forEach((chip, i) => chip.style.setProperty('--eo', ease((p - .7 - i * .035) / .12).toFixed(3)));
  };
  measure();
  new ResizeObserver(() => { measure(); update(); }).observe(stage);
  const update = () => {
    const rect = section.getBoundingClientRect();
    apply(clamp((73 - rect.top) / Math.max(1, rect.height - innerHeight)));
  };
  return update;
}

// The My videos capture turns toward you as it scrolls into view.
function panelTilt() {
  const card = document.querySelector<HTMLElement>('.panel-card');
  if (!card) return () => undefined;
  return () => {
    if (reducedMotion.matches) { card.style.setProperty('--tilt', '1'); return; }
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--tilt', ease((innerHeight - rect.top) / (innerHeight * .75)).toFixed(3));
  };
}

export function initSections() {
  upNext(); pictures(); transcript();
  const updates = [editor(), panelTilt()];
  let frame = 0;
  const run = () => { frame = 0; updates.forEach(update => update()); };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(run); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  reducedMotion.addEventListener('change', schedule);
  run();
}
