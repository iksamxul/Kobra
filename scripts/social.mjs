// Renders the link-preview card (scripts/social.html) to public/assets/social-v1.jpg, 2400×1260.
// Needs the app captures in captures/ (see public/assets/screens/MANIFEST.md).
//   SHOWCASE_BROWSER=msedge node scripts/social.mjs
import { chromium } from '@playwright/test';
import { stat } from 'node:fs/promises';

const out = new URL('../public/assets/social-v1.jpg', import.meta.url);
const browser = await chromium.launch({ channel: process.env.SHOWCASE_BROWSER || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.goto(new URL('./social.html', import.meta.url).href);
const missing = await page.evaluate(async () => {
  await document.fonts.ready;
  const images = [...document.images];
  await Promise.all(images.map(image => image.decode().catch(() => undefined)));
  return images.filter(image => !image.naturalWidth).map(image => image.getAttribute('src'));
});
if (missing.length) throw Error(`Missing images: ${missing.join(', ')}. Run the app's --review-site capture first.`);
await page.screenshot({ path: out.pathname.replace(/^\/([A-Za-z]:)/, '$1'), type: 'jpeg', quality: 90 });
await browser.close();
console.log(`Wrote ${out.pathname} (${Math.round((await stat(out)).size / 1024)} KB)`);
