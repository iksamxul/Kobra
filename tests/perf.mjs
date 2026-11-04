// Scroll-cost probe: node tests/perf.mjs [url]. Scrolls the whole page 24 px per frame in Edge
// and reports frame-time percentiles plus any long animation frames with their scripts.
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge', args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
await page.goto(process.argv[2] || 'http://127.0.0.1:4181/');
await page.waitForSelector('#hero-stage[data-renderer]');
const result = await page.evaluate(async () => {
  const loaf = [];
  new PerformanceObserver(list => list.getEntries().forEach(entry => loaf.push({ d: Math.round(entry.duration), y: scrollY, s: entry.scripts?.map(s => `${s.sourceFunctionName}@${(s.sourceURL || '').split('/').pop()}:${Math.round(s.duration)}`).join(' ') }))).observe({ type: 'long-animation-frame', buffered: false });
  const frames = [];
  let last = performance.now();
  const max = document.documentElement.scrollHeight - innerHeight;
  for (let y = 0; y < max; y += 24) {
    scrollTo(0, y);
    await new Promise(r => requestAnimationFrame(r));
    const now = performance.now(); frames.push(now - last); last = now;
  }
  frames.sort((a, b) => a - b);
  const pct = q => Math.round(frames[Math.floor(frames.length * q)] * 10) / 10;
  return { frames: frames.length, p50: pct(.5), p90: pct(.9), p99: pct(.99), over33: frames.filter(f => f > 33).length, loaf: loaf.slice(0, 12) };
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
