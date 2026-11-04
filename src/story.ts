import { modes } from './config';
import { clamp, easeInOut, easeOut, motion, onScroll, range } from './scroll';

// Scroll-scrubbed sections. Each writes custom properties or classes only; the CSS decides
// what they mean, and only under html.motion, so static layouts ignore them entirely.

/** Statement: words brighten one by one as the section passes (--k is the reading front). */
function statement() {
  const section = document.querySelector<HTMLElement>('.statement');
  const text = section?.querySelector<HTMLElement>('[data-words]');
  if (!section || !text) return;
  const words = text.textContent!.trim().split(/\s+/);
  text.replaceChildren(...words.flatMap((word, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.style.setProperty('--i', String(i));
    span.textContent = word;
    return i ? [' ', span] : [span];
  }));
  text.setAttribute('aria-label', words.join(' '));
  const facts = section.querySelector<HTMLElement>('.facts');
  facts?.querySelectorAll('li').forEach((item, i) => item.style.setProperty('--i', String(i)));
  onScroll(section, 'pin', p => {
    text.style.setProperty('--k', (range(p, .04, .7) * (words.length + 1)).toFixed(3));
    facts?.style.setProperty('--facts', range(p, .7, .9).toFixed(3));
  });
}

/** Everyday: the step nearest the middle of the screen chooses the crop in the sticky frame. */
function everyday() {
  const list = document.querySelector<HTMLElement>('.feature-list');
  if (!list) return;
  const steps = [...list.querySelectorAll<HTMLElement>('.feature-step')];
  const frames = [...list.querySelectorAll<HTMLElement>('[data-frame]')];
  const dots = [...list.querySelectorAll<HTMLElement>('.frame-dots li')];
  let centers: number[] = [], active = 0;
  const measure = () => {
    let top = 0, node: HTMLElement | null = null;
    centers = steps.map(step => {
      top = 0; node = step;
      while (node && node !== list) { top += node.offsetTop; node = node.offsetParent as HTMLElement | null; }
      return top + step.offsetHeight / 2;
    });
  };
  onScroll(list, 'view', (_, rect) => {
    const middle = innerHeight / 2 - rect.top;
    let next = 0;
    centers.forEach((center, i) => { if (Math.abs(center - middle) < Math.abs(centers[next] - middle)) next = i; });
    if (next === active) return;
    active = next;
    [steps, frames, dots].forEach(group => group.forEach((element, i) => element.classList.toggle('is-active', i === next)));
  }, { measure });
}

/** Feature bar: the track slides sideways with vertical scroll; the tabs follow it. */
function featureBar() {
  const section = document.querySelector<HTMLElement>('.features');
  const pin = section?.querySelector<HTMLElement>('.features-pin');
  const track = section?.querySelector<HTMLElement>('.fb-track');
  if (!section || !pin || !track) return;
  const panels = [...track.querySelectorAll<HTMLElement>('.fb-panel')];
  const tabs = [...section.querySelectorAll<HTMLAnchorElement>('[data-fb]')];
  let overflow = 0, centers: number[] = [], width = 0, active = 0;
  const measure = () => {
    section.style.removeProperty('--fb-h');
    width = pin.clientWidth;
    overflow = Math.max(0, track.scrollWidth - width);
    centers = panels.map(panel => panel.offsetLeft + panel.offsetWidth / 2);
    section.style.setProperty('--fb-h', `${Math.round(overflow + innerHeight * 1.15)}px`);
  };
  const setActive = (index: number) => {
    active = index;
    panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
    tabs.forEach((tab, i) => { if (i === index) tab.setAttribute('aria-current', 'true'); else tab.removeAttribute('aria-current'); });
  };
  onScroll(section, 'pin', p => {
    // A short hold at both ends lets the first and last panels settle before moving on.
    const x = range(p, .06, .94) * overflow;
    track.style.setProperty('--fb-x', x.toFixed(1));
    section.style.setProperty('--fb-p', range(p, .06, .94).toFixed(4));
    const view = x + width / 2;
    let next = 0;
    centers.forEach((center, i) => {
      panels[i].style.setProperty('--near', (1 - clamp(Math.abs(center - view) / (width * .55))).toFixed(3));
      if (Math.abs(center - view) < Math.abs(centers[next] - view)) next = i;
    });
    if (next !== active) setActive(next);
  }, { measure, reset: () => section.style.removeProperty('--fb-h') });
  // Tabs are anchors; with motion on they scroll to the point where that panel is centred.
  tabs.forEach((tab, i) => tab.addEventListener('click', event => {
    if (!motion()) return;
    event.preventDefault();
    const top = section.getBoundingClientRect().top + scrollY;
    const travel = section.offsetHeight - innerHeight;
    const at = overflow ? clamp((centers[i] - width / 2) / overflow) : 0;
    scrollTo({ top: top + travel * (.06 + at * .88), behavior: 'smooth' });
  }));
}

/** Appearance: the frame opens (clip-path), then Midnight wipes across Pearl. */
function appearance() {
  const section = document.querySelector<HTMLElement>('.appearance');
  if (!section) return;
  onScroll(section, 'pin', p => {
    section.style.setProperty('--open', easeOut(range(p, 0, .32)).toFixed(4));
    section.style.setProperty('--wipe', (1 - easeInOut(range(p, .38, .86))).toFixed(4));
  }, { reset: () => { section.style.removeProperty('--open'); section.style.removeProperty('--wipe'); } });
}

/** Two modes: the switch swaps the whole stack; scroll moves its layers at different depths. */
function modesStack() {
  const stack = document.querySelector<HTMLElement>('.stack');
  if (!stack) return;
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('button[data-mode]')];
  const set = (mode: keyof typeof modes) => {
    const content = modes[mode];
    stack.dataset.showing = mode;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    stack.querySelectorAll<HTMLElement>('[data-set]').forEach(element => element.setAttribute('aria-hidden', String(element.dataset.set !== mode)));
    document.querySelector('#mode-title')!.textContent = content.title;
    document.querySelector('#mode-description')!.textContent = content.description;
    document.querySelector('#mode-features')!.textContent = content.features;
  };
  buttons.forEach(button => {
    button.addEventListener('click', () => set(button.dataset.mode as keyof typeof modes));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'kobra' : event.key === 'End' ? 'studio' : stack.dataset.showing === 'kobra' ? 'studio' : 'kobra';
      set(next);
      document.querySelector<HTMLButtonElement>(`[data-mode="${next}"]`)!.focus();
    });
  });
  set('kobra');
  onScroll(stack, 'view', p => {
    const offset = p - .5;
    stack.style.setProperty('--pb', `${(offset * -36).toFixed(1)}px`);
    stack.style.setProperty('--pc', `${(offset * -150).toFixed(1)}px`);
    stack.style.setProperty('--ps', `${(offset * -100).toFixed(1)}px`);
  });
}

/** Local-first: each line rises out of its own mask as the section enters. */
function maskLines() {
  document.querySelectorAll<HTMLElement>('.private-inner').forEach(block => {
    block.querySelectorAll<HTMLElement>('.mask-lines>span').forEach((line, i) => line.style.setProperty('--i', String(i)));
    onScroll(block, 'enter', p => block.style.setProperty('--m', easeOut(p).toFixed(4)));
  });
}

export function initStory() {
  statement(); everyday(); featureBar(); appearance(); modesStack(); maskLines();
}
