// Section captures for visual review: node tests/capture.mjs [url] [width] [theme]
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] || 'http://127.0.0.1:4173/';
const width = Number(process.argv[3] || 1440), theme = process.argv[4] || 'dark';
const browser = await chromium.launch({ channel: process.env.SHOWCASE_BROWSER || undefined });
const page = await browser.newPage({ viewport: { width, height: width < 700 ? 844 : 900 }, colorScheme: theme });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(url);
await page.waitForTimeout(1500);
await mkdir('review/sections', { recursive: true });
const shoot = async (name, y) => { await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), y); await page.waitForTimeout(1300); await page.screenshot({ path: `review/sections/${theme}-${width}-${name}.png` }); };
const top = selector => page.evaluate(s => document.querySelector(s).getBoundingClientRect().top + scrollY, selector);
await shoot('01-hero', 0);
const everyday = await top('#everyday');
await shoot('02-everyday', everyday + 40);
await shoot('03-everyday-more', everyday + 860);
await shoot('04-everyday-history', everyday + 1500);
const editor = await top('#editor');
const height = await page.evaluate(() => document.querySelector('#editor').offsetHeight - innerHeight);
for (const [i, p] of [[1, .05], [2, .2], [3, .5], [4, .62], [5, .9]]) await shoot(`05-editor-${i}`, editor - 73 + height * p);
await shoot('06-download', await top('#download') - 100);
console.log(JSON.stringify({ errors, height: await page.evaluate(() => document.documentElement.scrollHeight), emblem: await page.evaluate(() => document.querySelector('#emblem-stage').dataset.renderer || null) }));
await browser.close();
