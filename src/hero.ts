import { easeInOut, motion, onScroll, range } from './scroll';
import { heroTexture, type Theme } from './images';
import type { Framing, HeroScene } from './scene';

// The hero's scroll choreography. One progress value drives both the CSS display (always
// present, and the fallback without WebGL) and the WebGL display, so they agree exactly:
//   0.00-0.20  headline lifts away
//   0.00-0.34  the display rises to the centre and turns to face you
//   0.36-0.82  the camera moves in until the entire screen fits the viewport
//   0.80-0.86  the crisp HTML screenshot takes over from the WebGL texture
//   0.86-0.95  everything but the video dims and a caption settles; then the page moves on
// Where the video sits inside the Watch capture (fractions of the screen), for the spotlight.
// Re-check these when new captures arrive (see public/assets/screens/MANIFEST.md).
const VIDEO = { left: .1542, top: .1344, right: .8458, bottom: .7589 };
export function initHero(currentTheme: () => Theme) {
  const hero = document.querySelector<HTMLElement>('#top');
  const stage = document.querySelector<HTMLElement>('#hero-stage');
  if (!hero || !stage) return;
  const device = stage.querySelector<HTMLElement>('.device')!;
  const screen = stage.querySelector<HTMLElement>('.device-screen')!;
  const image = screen.querySelector<HTMLElement>('img')!;
  const copy = hero.querySelector<HTMLElement>('.hero-copy')!;
  let framing: Framing = { vw: 1, vh: 1, imgW: 1, startDy: 0, cover: 1 };
  let webgl: HeroScene | null = null;
  let progress = 0;
  // The CSS display is laid out at its final, viewport-covering size and scaled down until
  // then, so the handoff frame is rasterised 1:1 (scaling a small element up would soften
  // it). A hidden sizer carries the resting width from CSS (--device-rest).
  const sizer = Object.assign(document.createElement('span'), { className: 'device-sizer' });
  sizer.setAttribute('aria-hidden', 'true');
  stage.append(sizer);

  // Measured untransformed: offsetWidth ignores transforms, so scroll state never skews it.
  // Bezel and stand are percentages, so the proportions hold at any layout size.
  const measure = () => {
    const vw = stage.clientWidth, vh = stage.clientHeight, rest = sizer.offsetWidth;
    if (!vw || !rest || !image.offsetWidth) return;
    const imgW = rest * image.offsetWidth / device.offsetWidth;
    const imgH = imgW * image.offsetHeight / image.offsetWidth;
    const screenH = rest * screen.offsetHeight / device.offsetWidth;
    const copyBottom = copy.offsetTop + copy.offsetHeight;
    const startTop = Math.max(copyBottom + 40, vh * .52);
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header')) || 60;
    framing = { vw, vh, imgW, startDy: startTop + screenH / 2 - vh / 2, cover: Math.min(vw * .94 / imgW, (vh - 2 * header - 100) / imgH) };
    hero.style.setProperty('--device-w', `${(rest * framing.cover).toFixed(2)}px`);
    webgl?.setFraming(framing);
    // At full cover the screen is centred at imgW x imgH times cover.
    const w = imgW * framing.cover, h = imgH * framing.cover, left = (vw - w) / 2, top = (vh - h) / 2;
    hero.style.setProperty('--spot-x', `${(left + w * VIDEO.left).toFixed(1)}px`);
    hero.style.setProperty('--spot-y', `${(top + h * VIDEO.top).toFixed(1)}px`);
    hero.style.setProperty('--spot-w', `${(w * (VIDEO.right - VIDEO.left)).toFixed(1)}px`);
    hero.style.setProperty('--spot-h', `${(h * (VIDEO.bottom - VIDEO.top)).toFixed(1)}px`);
  };

  const update = (p: number) => {
    progress = p;
    const rise = easeInOut(range(p, 0, .34));
    const dolly = easeInOut(range(p, .36, .82));
    const handoff = range(p, .8, .86);
    // Scale follows 1/distance, exactly as the WebGL camera sees it; relative to cover size.
    const scale = 1 / (1 - dolly * (1 - 1 / framing.cover)) / framing.cover;
    hero.style.setProperty('--copy-out', range(p, .02, .2).toFixed(4));
    hero.style.setProperty('--dy', `${((1 - rise) * framing.startDy).toFixed(2)}px`);
    hero.style.setProperty('--ds', scale.toFixed(5));
    hero.style.setProperty('--dry', `${((1 - rise) * -12).toFixed(3)}deg`);
    hero.style.setProperty('--drx', `${((1 - rise) * 9).toFixed(3)}deg`);
    hero.style.setProperty('--handoff', handoff.toFixed(4));
    hero.style.setProperty('--caption', easeInOut(range(p, .86, .95)).toFixed(4));
    webgl?.setState(rise, dolly, handoff < 1);
  };
  const reset = () => ['--copy-out', '--dy', '--ds', '--dry', '--drx', '--handoff', '--caption', '--device-w'].forEach(name => hero.style.removeProperty(name));
  onScroll(hero, 'pin', update, { measure, reset });

  // WebGL loads as its own chunk once the hero is near; the CSS display is complete without it.
  let started = false;
  const start = () => {
    if (started || !motion()) return;
    started = true;
    void import('./scene')
      .then(module => module.createHeroScene(stage, heroTexture, currentTheme()))
      .then(scene => {
        webgl = scene;
        measure();
        scene.setFraming(framing);
        update(progress);
        // After the 3D view has faded in, the hand-off follows scroll exactly (no lagging fades).
        setTimeout(() => stage.classList.add('is-settled'), 1000);
      })
      .catch(() => { stage.dataset.renderer = 'fallback'; });
  };
  new IntersectionObserver((entries, observer) => {
    if (entries.some(entry => entry.isIntersecting) && motion()) { observer.disconnect(); start(); }
  }, { rootMargin: '200px' }).observe(stage);
  window.addEventListener('kobra-site-theme', () => webgl?.setTheme(currentTheme()));
}
