import './style.css';
import './features.css';
import './sections.css';
import './editor.css';
import { release } from './config';
import { retryImages, themedImages, type Theme } from './images';
import { initHero } from './hero';
import { initStory } from './story';
import { initEditor } from './editor';
import { initSections } from './sections';
import { initInteractions } from './interactions';
import { motion, refresh } from './scroll';

retryImages();

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const theme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

// Appearance: Pearl or Midnight, remembered, with images and 3D following along.
function applyTheme() {
  const dark = theme() === 'dark';
  $('.theme-toggle').setAttribute('aria-label', `Switch to ${dark ? 'Pearl' : 'Midnight'} appearance`);
  $('meta[name="theme-color"]').setAttribute('content', dark ? '#111113' : '#f5f5f7');
  themedImages(theme());
}
function toggleTheme(origin?: HTMLElement) {
  const flip = () => {
    document.documentElement.dataset.theme = theme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('kobra-site-theme', theme()); } catch { /* Appearance still works when storage is unavailable. */ }
    applyTheme();
    window.dispatchEvent(new Event('kobra-site-theme'));
  };
  // The new appearance spreads from the button that was pressed, where supported.
  if (!motion() || !document.startViewTransition || !origin) { flip(); return; }
  const rect = origin.getBoundingClientRect();
  const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
  const root = document.documentElement;
  root.style.setProperty('--vt-x', `${x}px`);
  root.style.setProperty('--vt-y', `${y}px`);
  root.style.setProperty('--vt-r', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`);
  root.classList.add('theme-reveal');
  document.startViewTransition(flip).finished.finally(() => root.classList.remove('theme-reveal'));
}
document.querySelectorAll<HTMLElement>('.theme-toggle, .appearance-try').forEach(button => button.addEventListener('click', () => toggleTheme(button)));
applyTheme();

// Downloads: only real https release URLs from config.ts, or an honest note.
const safeUrl = (value: string) => {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
};
const downloads = [
  { label: 'Download for Windows', url: release.setupUrl, primary: true },
  { label: 'Get the portable version', url: release.portableUrl, primary: false },
].filter(entry => safeUrl(entry.url));
if (downloads.length) {
  $('#release-actions').replaceChildren(...downloads.map(entry => {
    const link = document.createElement('a');
    link.className = entry.primary ? 'button magnetic' : 'text-link';
    link.href = safeUrl(entry.url)!;
    const label = document.createElement('span');
    label.textContent = entry.label;
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↓';
    link.append(label, ' ', arrow);
    return link;
  }));
  const note = $('#release-note');
  note.textContent = `Version ${release.version} · Windows 10 and 11, x64 · Unsigned, so SmartScreen asks once`;
  if (safeUrl(release.notesUrl)) {
    const notes = document.createElement('a');
    notes.href = safeUrl(release.notesUrl)!;
    notes.textContent = 'Release notes and SHA-256';
    note.append(' · ', notes);
  }
} else {
  $('#release-actions').replaceChildren(Object.assign(document.createElement('p'), { className: 'release-pending', textContent: 'Public download links are being prepared.' }));
  $('#release-note').textContent = 'Windows x64 · Local-first · Pearl & Midnight';
}
if (safeUrl(release.repositoryUrl)) {
  const link = document.createElement('a');
  link.href = safeUrl(release.repositoryUrl)!;
  link.textContent = 'GitHub';
  $('.site-footer>div').append(link);
}

// Reveals on first sight; with motion off, the CSS never hides anything.
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
}, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .lines').forEach(element => observer.observe(element));

initHero(theme);
initStory();
initEditor();
initSections();
initInteractions();
refresh();

// The download mark becomes a 3D emblem when it comes near; the image stays as its fallback.
const emblem = $('#emblem-stage');
new IntersectionObserver((entries, emblemObserver) => {
  if (!entries.some(entry => entry.isIntersecting) || !motion()) return;
  emblemObserver.disconnect();
  void import('./emblem').then(module => module.createEmblem(emblem)).catch(() => { emblem.dataset.renderer = 'fallback'; });
}, { rootMargin: '400px' }).observe(emblem);
