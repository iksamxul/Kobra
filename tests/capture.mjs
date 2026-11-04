// Section captures for visual review: node tests/capture.mjs [url] [width] [light|dark]
// Pinned sections are captured at several scroll positions. Output: review/sections/.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] || 'http://127.0.0.1:4181/';
const width = Number(process.argv[3] || 1440), theme = process.argv[4] || 'dark';
const only = process.argv[5] || '';
const browser = await chromium.launch({ channel: process.env.SHOWCASE_BROWSER || undefined });
const page = await browser.newPage({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: theme });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url);
await page.waitForTimeout(1500);
await mkdir('review/sections', { recursive: true });
const shoot = async (name, top) => {
  if (only && !name.includes(only)) return;
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), top);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `review/sections/${theme}-${width}-${name}.png` });
};
const top = selector => page.evaluate(s => document.querySelector(s).getBoundingClientRect().top + scrollY, selector);
// Scroll position at which a pinned section has the given progress.
const at = (selector, p) => page.evaluate(([s, p]) => {
  const el = document.querySelector(s);
  return el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * p;
}, [selector, p]);

for (const p of [0, .2, .5, .78, .97]) await shoot(`01-hero-${p}`, await at('#top', p));
for (const p of [.3, .8]) await shoot(`02-statement-${p}`, await at('.statement', p));
await shoot('03-everyday-head', await top('#everyday') - 40);
for (const i of [0, 2, 4]) await shoot(`03-everyday-${i}`, await page.evaluate(i => {
  const step = document.querySelectorAll('.feature-step')[i];
  return step.getBoundingClientRect().top + scrollY + step.offsetHeight / 2 - innerHeight / 2;
}, i));
for (const i of [0, 1, 2, 3, 4, 5]) await shoot(`04-features-${i}`, await at('#features', .06 + i * .176));
await shoot('05-demos', await top('#try') + 160);
await shoot('05-demos-2', await top('.bento') + 520);
for (const p of [.12, .6, .95]) await shoot(`06-appearance-${p}`, await at('#appearance', p));
await shoot('07-studio', await top('.stack') - 200);
await shoot('08-editor-head', await top('#editor'));
for (const p of [.1, .38, .58, .7, .83, .99]) await shoot(`08-editor-${p}`, await at('.editor-run', p));
await shoot('09-keyframes', await top('.kf-demo') - 120);
await shoot('09-capabilities', await top('.capabilities') - 200);
await shoot('10-private', await top('.private') + 60);
await shoot('11-faq', await top('.faq'));
await shoot('12-download', await top('#download') - 60);
console.log(JSON.stringify({ errors, height: await page.evaluate(() => document.documentElement.scrollHeight), hero: await page.evaluate(() => document.querySelector('#hero-stage').dataset.renderer || null), emblem: await page.evaluate(() => document.querySelector('#emblem-stage').dataset.renderer || null) }));
await browser.close();
