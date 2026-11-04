// Image audit: every raster on the page, at several viewports and pixel densities.
//   node tests/image-audit.mjs [url]
// For each image, after scrolling it into view: the file the browser chose, how many device
// pixels it is drawn across (layout width x devicePixelRatio) against the pixels the file has,
// and how much object-fit:cover trims from it. Fails (exit 1) when an image is drawn more than
// 10% larger than its pixels or loses more than 2% of either dimension to cropping.
import { chromium } from '@playwright/test';

const url = process.argv[2] || 'http://127.0.0.1:4181/';
const runs = [
  { width: 1440, height: 900, dpr: 2, theme: 'dark' },
  { width: 1920, height: 1080, dpr: 1, theme: 'light' },
  { width: 1024, height: 768, dpr: 2, theme: 'light' },
  { width: 390, height: 844, dpr: 3, theme: 'dark', mobile: true },
];
const browser = await chromium.launch({ channel: process.env.SHOWCASE_BROWSER || undefined });
let failures = 0;
for (const run of runs) {
  const page = await browser.newPage({ viewport: { width: run.width, height: run.height }, deviceScaleFactor: run.dpr, colorScheme: run.theme, isMobile: !!run.mobile, hasTouch: !!run.mobile });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const seen = new Map();
  for (let y = 0; y <= total; y += Math.round(run.height * .5)) {
    await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(160);
    const rows = await page.evaluate(async () => {
      const out = [];
      for (const img of document.querySelectorAll('img')) {
        const box = img.getBoundingClientRect();
        if (!box.width || box.bottom < 0 || box.top > innerHeight) continue;
        // Lazy images inside hidden sets never load; don't wait on them.
        if (!img.complete) await Promise.race([img.decode().catch(() => undefined), new Promise(r => setTimeout(r, 800))]);
        if (!img.naturalWidth || getComputedStyle(img).visibility === 'hidden') continue;
        if (/\.svg($|\?)/.test(img.currentSrc || img.src)) continue; // vectors scale freely
        const style = getComputedStyle(img);
        const fit = style.objectFit;
        // naturalWidth is divided by the srcset density; load the chosen file alone for its real pixels.
        const probe = new Image();
        probe.src = img.currentSrc || img.src;
        await probe.decode().catch(() => undefined);
        const nw = probe.naturalWidth || img.naturalWidth, nh = probe.naturalHeight || img.naturalHeight;
        // Layout size (transforms excluded) is what the browser rasterises at.
        const lw = img.offsetWidth || box.width, lh = img.offsetHeight || box.height;
        let drawn = lw, trimX = 0, trimY = 0;
        if (fit === 'cover') {
          const scale = Math.max(lw / nw, lh / nh);
          drawn = nw * scale;
          trimX = 1 - lw / (nw * scale); trimY = 1 - lh / (nh * scale);
        } else if (fit === 'contain') {
          drawn = nw * Math.min(lw / nw, lh / nh);
        } else if (fit === 'fill' && Math.abs((lw / lh) / (nw / nh) - 1) > .02) {
          trimX = -1; // stretched
        }
        const file = (img.currentSrc || img.src).split('/').pop();
        out.push({ file, reframe: img.dataset.crop === 'reframe', cls: img.className || img.parentElement.className, nw, nh, lw: Math.round(lw), drawn: Math.round(drawn * devicePixelRatio), trimX, trimY, fit });
      }
      return out;
    });
    for (const row of rows) {
      const key = `${row.file}|${row.cls}`;
      const prev = seen.get(key);
      if (!prev || row.drawn > prev.drawn) seen.set(key, row);
    }
  }
  console.log(`\n${run.width}x${run.height} @${run.dpr}x ${run.theme}`);
  for (const row of [...seen.values()].sort((a, b) => b.drawn / b.nw - a.drawn / a.nw)) {
    const enlarge = row.drawn / row.nw;
    const problems = [];
    if (enlarge > 1.1) problems.push(`drawn ${enlarge.toFixed(2)}x its pixels`);
    if (row.trimX < 0) problems.push('stretched');
    // data-crop="reframe": the Editor demo fills 9:16, 1:1 and 4:5 shapes on purpose, as the app's Fill does.
    if (!row.reframe && (row.trimX > .02 || row.trimY > .02)) problems.push(`cropped ${Math.round(row.trimX * 100)}% x ${Math.round(row.trimY * 100)}%`);
    if (problems.length) failures++;
    console.log(`${problems.length ? 'FAIL' : ' ok '} ${row.file.padEnd(40)} ${String(row.nw).padStart(5)}px file, ${String(row.drawn).padStart(5)} device px  ${row.fit.padEnd(7)} ${String(row.cls).slice(0, 28).padEnd(28)} ${problems.join('; ')}`);
  }
  await page.close();
}
await browser.close();
console.log(failures ? `\n${failures} problems.` : '\nNo image is enlarged, stretched or cropped.');
process.exitCode = failures ? 1 : 0;
