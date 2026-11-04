import { motion } from './scroll';

// Working previews for everyday Kobra features. Each mirrors the app's behavior and settles
// to a complete, readable state with reduced motion or without JavaScript.

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
    status.textContent = state === 'played' ? 'Now playing Big Buck Bunny' : 'Cancelled · the video stays put';
  };
  const start = () => {
    clearInterval(timer); left = 5;
    demo.dataset.state = 'idle'; demo.style.setProperty('--ring', '0');
    label.textContent = 'Up next in'; number.textContent = '5';
    buttons.play.hidden = buttons.cancel.hidden = false; buttons.replay.hidden = true;
    status.textContent = 'Interaction preview';
    if (!motion()) return;
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
  let timer = 0, touched = false;
  const select = (index: number) => {
    lines.forEach((line, i) => { if (i === index) line.setAttribute('aria-current', 'true'); else line.removeAttribute('aria-current'); });
    progress.style.setProperty('--t', String((index + 1) / lines.length));
  };
  lines.forEach((line, index) => line.addEventListener('click', () => { touched = true; clearInterval(timer); select(index); }));
  const empty = Object.assign(document.createElement('p'), { className: 'transcript-empty', hidden: true });
  empty.setAttribute('aria-live', 'polite');
  list.after(empty);
  document.querySelector<HTMLInputElement>('.mini-search input')!.addEventListener('input', event => {
    clearInterval(timer);
    touched = true;
    const raw = (event.target as HTMLInputElement).value.trim(), query = raw.toLowerCase();
    lines.forEach(line => { line.parentElement!.hidden = !!query && !line.textContent!.toLowerCase().includes(query); });
    const none = !!query && lines.every(line => line.parentElement!.hidden);
    empty.hidden = !none;
    empty.textContent = none ? `No line mentions “${raw}”.` : '';
  });
  select(0);
  const seen = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    seen.disconnect();
    if (touched || !motion()) return;
    let index = 0;
    timer = window.setInterval(() => { index += 1; if (index >= lines.length) { clearInterval(timer); return; } select(index); }, 1700);
  }, { threshold: .6 });
  seen.observe(list);
}

// A clearly labeled demo of saving a moment, not a simulated app action.
function moment() {
  const button = document.querySelector<HTMLButtonElement>('.save-moment');
  if (!button) return;
  button.addEventListener('click', () => {
    const saved = document.querySelector('.moment-demo')!.classList.toggle('is-saved');
    button.setAttribute('aria-pressed', String(saved));
    button.querySelector('span')!.textContent = saved ? 'Moment saved' : 'Save this moment';
    document.querySelector('#moment-status')!.textContent = saved ? 'Preview: this moment is bookmarked. Click again to reset the demonstration.' : 'Bookmark preview reset.';
  });
}

export function initSections() { upNext(); pictures(); transcript(); moment(); }
