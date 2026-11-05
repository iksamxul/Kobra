// Theme-aware screens. File names carry the appearance (watch-light-1440.webp), so switching
// rewrites -light- to -dark- in src and srcset. Lazy images below the fold are updated before
// they load, so only the hero can ever be fetched twice (and only when the saved appearance
// differs from the system one, which the HTML's <picture> media query already covers).
export type Theme = 'light' | 'dark';

const swap = (value: string, theme: Theme) => value.replace(/-(light|dark)-/g, `-${theme}-`);

export function themedImages(theme: Theme) {
  document.querySelectorAll<HTMLElement>('[data-themed]').forEach(element => {
    const targets = element instanceof HTMLPictureElement ? element.querySelectorAll<HTMLImageElement | HTMLSourceElement>('source, img') : [element as HTMLImageElement];
    targets.forEach(target => {
      if (target.srcset) { const next = swap(target.srcset, theme); if (next !== target.srcset) target.srcset = next; }
      if (target instanceof HTMLImageElement) { const src = target.getAttribute('src') || ''; const next = swap(src, theme); if (next !== src) target.setAttribute('src', next); }
    });
  });
}

/** The hero texture: always the 2880 px screen, mipmapped by the GPU. */
export const heroTexture = (theme: Theme) => `${import.meta.env.BASE_URL}assets/screens/watch-${theme}-2880.webp`;

/** A request dropped by a shaky connection leaves a broken image; try it again twice. */
export function retryImages() {
  document.addEventListener('error', event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.getAttribute('src')) return;
    const tries = Number(img.dataset.retry || 0);
    if (tries >= 2) return;
    img.dataset.retry = String(tries + 1);
    const bust = (url: string) => url.replace(/(\.(?:webp|jpe?g|png|svg))(\?r=\d+)?/g, `$1?r=${tries + 1}`);
    setTimeout(() => { if (img.srcset) img.srcset = bust(img.srcset); img.src = bust(img.getAttribute('src')!); }, 1200 * (tries + 1));
  }, true);
}
