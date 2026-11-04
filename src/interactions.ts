import { motion, onScroll } from './scroll';

// Small pointer and selection details: sliding indicators, magnetic primaries, tilting cards.
// Pointer effects only run for a fine pointer with motion allowed; keyboard and touch get
// the same controls without them.
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const pointerEffects = () => finePointer.matches && motion();

/** Segmented controls: a soft pill slides to whichever item is pressed or current. */
function segmented() {
  document.querySelectorAll<HTMLElement>('.segmented').forEach(group => {
    const thumb = group.querySelector<HTMLElement>('.seg-thumb');
    if (!thumb) return;
    let first = true;
    const sync = () => {
      const selected = group.querySelector<HTMLElement>(':scope>[aria-pressed=true], :scope>[aria-current=true]');
      if (!selected || !selected.offsetWidth) return;
      if (first) thumb.style.transition = 'none';
      thumb.style.setProperty('--x', `${selected.offsetLeft}px`);
      thumb.style.setProperty('--w', `${selected.offsetWidth}px`);
      group.classList.add('has-thumb');
      if (first) { void thumb.offsetWidth; thumb.style.transition = ''; first = false; }
    };
    new MutationObserver(sync).observe(group, { subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'aria-current'] });
    new ResizeObserver(sync).observe(group);
    sync();
  });
}

/** Navigation: the pill follows the hovered link, otherwise the section you are reading. */
function navigation() {
  const nav = document.querySelector<HTMLElement>('.nav-links');
  const indicator = nav?.querySelector<HTMLElement>('.nav-indicator');
  if (!nav || !indicator) return;
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('a')];
  const inView = links.map(() => false);
  let hovered: HTMLElement | null = null;
  const place = () => {
    const current = links.find((_, i) => inView[i]) || null;
    links.forEach(link => { if (link === current) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current'); });
    const target = hovered || current;
    indicator.classList.toggle('is-on', !!target);
    if (target) { indicator.style.setProperty('--x', `${target.offsetLeft}px`); indicator.style.setProperty('--w', `${target.offsetWidth}px`); }
  };
  links.forEach((link, i) => {
    link.addEventListener('pointerenter', () => { hovered = link; place(); });
    link.addEventListener('focus', () => { hovered = link; place(); });
    link.addEventListener('blur', () => { hovered = null; place(); });
    const section = document.querySelector(link.hash);
    if (section) onScroll(section, 'view', (_, rect) => {
      const now = rect.top <= innerHeight * .45 && rect.bottom >= innerHeight * .45;
      if (now !== inView[i]) { inView[i] = now; place(); }
    }, { always: true });
  });
  nav.addEventListener('pointerleave', () => { hovered = null; place(); });
  const progress = document.querySelector<HTMLElement>('.reading-progress');
  if (progress) onScroll(document.documentElement, 'pin', p => progress.style.setProperty('--read', p.toFixed(4)), { always: true });
}

/** Magnetic primaries: within a short reach, the button leans toward the pointer. */
function magnetic() {
  const buttons = [...document.querySelectorAll<HTMLElement>('.magnetic')];
  let frame = 0, x = 0, y = 0;
  const update = () => {
    frame = 0;
    for (const button of buttons) {
      const rect = button.getBoundingClientRect();
      const dx = x - (rect.left + rect.width / 2), dy = y - (rect.top + rect.height / 2);
      const near = pointerEffects() && Math.abs(dx) < rect.width / 2 + 36 && Math.abs(dy) < rect.height / 2 + 30;
      button.classList.toggle('is-magnetic', near);
      button.style.setProperty('--mx', near ? `${Math.max(-10, Math.min(10, dx * .2)).toFixed(2)}px` : '0px');
      button.style.setProperty('--my', near ? `${Math.max(-8, Math.min(8, dy * .3)).toFixed(2)}px` : '0px');
    }
  };
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    x = event.clientX; y = event.clientY;
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { x = y = -9999; if (!frame) frame = requestAnimationFrame(update); });
}

/** Cards tilt a few degrees toward the pointer, with a soft glare where it points. */
function tilt() {
  document.querySelectorAll<HTMLElement>('.tilt').forEach(card => {
    let frame = 0, event: PointerEvent | null = null;
    const update = () => {
      frame = 0;
      if (!event || !pointerEffects()) return;
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width, py = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--tx', (px * 2 - 1).toFixed(3));
      card.style.setProperty('--ty', (py * 2 - 1).toFixed(3));
      card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      card.classList.add('is-tilting');
    };
    card.addEventListener('pointermove', next => {
      if (next.pointerType !== 'mouse') return;
      event = next;
      if (!frame) frame = requestAnimationFrame(update);
    });
    card.addEventListener('pointerleave', () => {
      event = null;
      card.classList.remove('is-tilting');
      card.style.setProperty('--tx', '0');
      card.style.setProperty('--ty', '0');
    });
  });
}

export function initInteractions() { segmented(); navigation(); magnetic(); tilt(); }
