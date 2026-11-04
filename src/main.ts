import './style.css';
import { modes, release } from './config';
import { initSections, themedImages } from './sections';

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const base = import.meta.env.BASE_URL;
const asset = (name: string) => `${base}assets/${name}`;
let selectedMode: keyof typeof modes = 'kobra';

function updateThemeAssets() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const theme = dark ? 'dark' : 'light';
  $('.theme-toggle').setAttribute('aria-label', `Switch to ${dark ? 'Pearl' : 'Midnight'} appearance`);
  $('meta[name="theme-color"]').setAttribute('content', dark ? '#111113' : '#f5f5f7');
  $('#mode-kobra').setAttribute('src', asset(`home-${theme}.webp`));
  $('#mode-studio').setAttribute('src', asset(`studio-${theme}.webp`));
  themedImages(theme);
}
function toggleTheme() {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('kobra-site-theme', document.documentElement.dataset.theme); } catch { /* Appearance still works when storage is unavailable. */ }
  updateThemeAssets();
  window.dispatchEvent(new Event('kobra-site-theme'));
}
$('.theme-toggle').addEventListener('click', toggleTheme);
$('.appearance-try').addEventListener('click', toggleTheme);
updateThemeAssets();

function setMode(mode: keyof typeof modes) {
  selectedMode = mode;
  const content = modes[mode];
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('#mode-kobra').classList.toggle('is-active', mode === 'kobra');
  $('#mode-studio').classList.toggle('is-active', mode === 'studio');
  $('#mode-kobra').setAttribute('aria-hidden', String(mode !== 'kobra'));
  $('#mode-studio').setAttribute('aria-hidden', String(mode !== 'studio'));
  $('#preview-label').textContent = content.label;
  $('#mode-title').textContent = content.title;
  $('#mode-description').textContent = content.description;
  $('#mode-features').textContent = content.features;
}
document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => {
  button.addEventListener('click', () => setMode(button.dataset.mode as keyof typeof modes));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'kobra' : event.key === 'End' ? 'studio' : selectedMode === 'kobra' ? 'studio' : 'kobra';
    setMode(next);
    $<HTMLButtonElement>(`[data-mode="${next}"]`).focus();
  });
});
setMode('kobra');

// A clearly labeled demo, not a fake download or a simulated app installation.
$('.save-moment').addEventListener('click', () => {
  const saved = $('.moment-demo').classList.toggle('is-saved');
  $('.save-moment').setAttribute('aria-pressed', String(saved));
  $('.save-moment span').textContent = saved ? 'Moment saved' : 'Save this moment';
  $('#moment-status').textContent = saved ? 'Preview: this moment is bookmarked. Click again to reset the demonstration.' : 'Bookmark preview reset.';
});
for (let i = 0; i < 43; i++) {
  const bar = document.createElement('i');
  const envelope = Math.sin((i + 1) / 44 * Math.PI);
  const height = 10 + envelope * (30 + Math.abs(Math.sin(i * 1.83)) * 90);
  bar.style.cssText = `--height:${height.toFixed(1)}px;--opacity:${(.25 + envelope * .65).toFixed(2)};--i:${i}`;
  $('.waveform').append(bar);
}

const safeUrl = (value: string) => {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
};
const downloads = [
  { label: 'Download for Windows', url: release.setupUrl, primary: true },
  { label: 'Get the portable version', url: release.portableUrl, primary: false },
].filter(entry => safeUrl(entry.url));
if (downloads.length) {
  $('#release-actions').replaceChildren();
  for (const entry of downloads) {
    const link = document.createElement('a');
    link.className = entry.primary ? 'button' : 'text-link';
    link.href = safeUrl(entry.url)!;
    link.textContent = `${entry.label} ↗`;
    $('#release-actions').append(link);
  }
  $('#release-note').textContent = `Version ${release.version} · Windows x64 · Unsigned build`;
}
if (safeUrl(release.repositoryUrl)) {
  const link = document.createElement('a');
  link.href = safeUrl(release.repositoryUrl)!;
  link.textContent = 'GitHub';
  $('.site-footer>div').append(link);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
}, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
if (!reducedMotion.matches) document.documentElement.classList.add('motion-enabled');

const story = $('#scroll-story');
let frame = 0;
function updateScroll() {
  frame = 0;
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  $('.reading-progress').style.transform = `scaleX(${scrollable > 0 ? scrollY / scrollable : 0})`;
  const rect = story.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (73 - rect.top) / Math.max(1, rect.height - innerHeight)));
  const step = Math.min(2, Math.floor(progress * 3));
  document.querySelectorAll<HTMLElement>('.story-step').forEach((element, index) => {
    element.classList.toggle('is-active', index === step);
    element.setAttribute('aria-hidden', String(!reducedMotion.matches && index !== step));
  });
  document.querySelectorAll('[data-story-image]').forEach((element, index) => {
    element.classList.toggle('is-active', index === step);
    element.setAttribute('aria-hidden', String(index !== (reducedMotion.matches ? 0 : step)));
  });
  document.querySelectorAll('.story-dots span').forEach((element, index) => element.classList.toggle('is-active', index === step));
  if (!reducedMotion.matches) $('.story-screen').style.transform = `rotateY(${-10 + progress * 16}deg) rotateX(${5 - progress * 4}deg) translateY(${Math.sin(progress * Math.PI) * -12}px)`;
}
const onScroll = () => { if (!frame) frame = requestAnimationFrame(updateScroll); };
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
reducedMotion.addEventListener('change', () => {
  document.documentElement.classList.toggle('motion-enabled', !reducedMotion.matches);
  updateScroll();
});
updateScroll();

// Load WebGL separately. The HTML screenshot is complete and usable without it.
const stage = $('#hero-stage');
let sceneStarted = false;
const sceneObserver = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting) || sceneStarted || reducedMotion.matches) return;
  sceneStarted = true;
  void import('./scene').then(module => module.createProductScene(stage, asset('watch-dark.webp'))).catch(() => {
    stage.dataset.renderer = 'fallback';
  });
}, { rootMargin: '300px' });
sceneObserver.observe(stage);

initSections();

// The download mark becomes a 3D emblem when it comes near; the image stays as its fallback.
const emblem = $('#emblem-stage');
let emblemStarted = false;
const emblemObserver = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting) || emblemStarted || reducedMotion.matches) return;
  emblemStarted = true;
  void import('./emblem').then(module => module.createEmblem(emblem)).catch(() => { emblem.dataset.renderer = 'fallback'; });
}, { rootMargin: '400px' });
emblemObserver.observe(emblem);
