import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const SETUP = 'https://github.com/iksamxul/Kobra/releases/download/v1.0.0/Kobra-Setup-1.0.0.exe';
const PORTABLE = 'https://github.com/iksamxul/Kobra/releases/download/v1.0.0/Kobra-Portable-1.0.0.exe';
const NOTES = 'https://github.com/iksamxul/Kobra/releases/tag/v1.0.0';

/** Scroll so a pinned section is at the given progress (0 = pin starts, 1 = pin ends). */
const scrollToProgress = (page: Page, selector: string, progress: number) => page.evaluate(([s, p]) => {
  const element = document.querySelector<HTMLElement>(s as string)!;
  window.scrollTo({ top: element.getBoundingClientRect().top + scrollY + (element.offsetHeight - innerHeight) * (p as number), behavior: 'instant' });
}, [selector, progress] as const);
/** How much larger the CSS display is drawn than its resting width. */
const deviceGrowth = (page: Page) => page.evaluate(() => document.querySelector('.device')!.getBoundingClientRect().width / document.querySelector<HTMLElement>('.device-sizer')!.offsetWidth);
const cssVar = (page: Page, selector: string, name: string) => page.locator(selector).evaluate((element, n) => Number(getComputedStyle(element).getPropertyValue(n)), name);

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 1024, 768, 390, 320]) {
    test(`${theme} ${width}px: static layout, images and working previews`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('./');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
      await expect(page.locator('#hero-title')).toBeVisible();
      // Reduced motion: no WebGL, the CSS display and its screenshot instead.
      await expect(page.locator('#hero-stage canvas')).toHaveCount(0);
      await expect(page.locator('.hero-fallback')).toBeVisible();
      expect(await page.locator('.hero-fallback').evaluate(image => (image as HTMLImageElement).currentSrc)).toContain(`watch-${theme}-`);
      for (const section of ['#experience', '#everyday', '#features', '#try', '#appearance', '#studio', '#editor', '#download']) {
        await page.locator(section).scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${section} overflows`).toBe(true);
      }
      // Every step of every scroll story is on the page, in normal flow.
      await expect(page.locator('.statement-text')).toContainText('everything you watch stays on your device');
      for (const step of await page.locator('.feature-step').all()) { await expect(step).toBeVisible(); await expect(step.locator('img')).toBeVisible(); }
      await expect(page.locator('.fb-panel')).toHaveCount(6);
      for (const panel of await page.locator('.fb-panel').all()) await expect(panel).toBeVisible();
      await expect(page.locator('.ed-step')).toHaveCount(5);
      for (const step of await page.locator('.ed-step').all()) await expect(step).toBeVisible();
      await expect(page.locator('.wipe-pearl')).toBeVisible();
      // Theme-aware screens follow the appearance.
      expect(await page.locator('.feature-step img').first().getAttribute('src')).toContain(`-${theme}-`);
      // Picture modes use the app's own factors.
      await page.locator('[data-picture="vivid"]').click();
      await expect(page.locator('.picture-frame')).toHaveCSS('--look', 'brightness(1.03) contrast(1.12) saturate(1.28)');
      await expect(page.locator('#picture-detail')).toContainText('Richer colour');
      await page.locator('[data-picture="standard"]').click();
      // Up next waits with reduced motion; its buttons still answer.
      await expect(page.locator('.countdown-number')).toHaveText('5');
      await page.locator('[data-countdown="play"]').click();
      await expect(page.locator('.countdown-label')).toHaveText('Now playing');
      await page.locator('[data-countdown="replay"]').click();
      await expect(page.locator('[data-countdown="cancel"]')).toBeVisible();
      // The transcript jumps to a line and filters by word.
      await page.locator('.transcript-list [data-line="2"]').click();
      await expect(page.locator('.transcript-list [data-line="2"]')).toHaveAttribute('aria-current', 'true');
      await page.locator('.mini-search input').fill('dragon');
      await expect(page.locator('.transcript-list li:visible')).toHaveCount(1);
      await page.locator('.mini-search input').fill('');
      // Two modes: the switch swaps stack and copy; arrow keys move between them.
      await page.locator('[data-mode="studio"]').click();
      await expect(page.locator('#mode-title')).toHaveText('Give your ideas somewhere to go.');
      await expect(page.locator('#mode-studio')).toHaveAttribute('aria-hidden', 'false');
      await page.locator('[data-mode="studio"]').press('ArrowLeft');
      await expect(page.locator('[data-mode="kobra"]')).toHaveAttribute('aria-pressed', 'true');
      await page.locator('.save-moment').click();
      await expect(page.locator('.save-moment')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#moment-status')).toContainText('Preview:');
      await page.locator('.save-moment').click();
      await expect(page.locator('.save-moment')).toHaveAttribute('aria-pressed', 'false');
      // Keyframes: scrubbing works without motion; easing is a segmented choice.
      await page.locator('.kf-scrub').fill('0');
      await expect.poll(() => cssVar(page, '.kf-title', '--ko')).toBe(0);
      await page.locator('[data-ease="linear"]').click();
      await expect(page.locator('[data-ease="linear"]')).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => cssVar(page, '.kf-title', '--ko')).toBe(1);
      // Downloads point at the published GitHub Release.
      await expect(page.locator('#release-actions a').first()).toHaveAttribute('href', SETUP);
      await expect(page.locator('#release-actions a').nth(1)).toHaveAttribute('href', PORTABLE);
      await expect(page.locator('#release-note a')).toHaveAttribute('href', NOTES);
      await page.locator('summary').first().click();
      await expect(page.locator('details').first()).toHaveAttribute('open', '');
      const broken = await page.evaluate(async () => {
        // Lazy images far below the fold never load on their own during a quick pass.
        [...document.images].forEach(image => { image.loading = 'eager'; });
        await Promise.all([...document.images].map(image => image.decode().catch(() => undefined)));
        return [...document.images].filter(image => !image.naturalWidth).map(image => image.src);
      });
      expect(broken).toEqual([]);
      expect(errors).toEqual([]);
      await mkdir('review/screenshots', { recursive: true });
      await page.screenshot({ path: `review/screenshots/${theme}-${width}-page.png`, fullPage: true });
    });
  }
}

test('motion: 3D hero, scroll stories, keyboard, theme persistence and credits', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('html')).toHaveClass(/\bmotion\b/);
  await expect(page.locator('#hero-stage')).toHaveAttribute('data-renderer', 'webgl', { timeout: 20000 });
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.feature-step img').first()).toHaveAttribute('src', /-dark-/);
  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  // The appearance spreads as a View Transition; wait until it has finished.
  await page.waitForFunction(() => !document.documentElement.classList.contains('theme-reveal'));
  await mkdir('review/screenshots', { recursive: true });
  // Hero: the headline lifts, the camera moves in until the screen covers the viewport.
  await scrollToProgress(page, '#top', .6);
  await expect.poll(() => cssVar(page, '#top', '--copy-out')).toBe(1);
  await expect.poll(() => deviceGrowth(page)).toBeGreaterThan(1.02);
  await page.screenshot({ path: 'review/screenshots/motion-hero-dolly.png' });
  await scrollToProgress(page, '#top', 1);
  await expect.poll(() => cssVar(page, '#top', '--caption')).toBeGreaterThan(.99);
  await expect.poll(() => cssVar(page, '#top', '--handoff')).toBe(1);
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'review/screenshots/motion-hero-handoff.png' });
  // Statement: by the end of its pin every word is lit.
  await scrollToProgress(page, '.statement', .85);
  await expect.poll(() => page.locator('.statement-text .w').last().evaluate(word => Number(getComputedStyle(word).opacity))).toBeGreaterThan(.99);
  // Everyday: the sticky frame follows the step in the middle of the screen.
  for (const index of [0, 2, 4]) {
    await page.evaluate(i => {
      const step = document.querySelectorAll<HTMLElement>('.feature-step')[i];
      window.scrollTo({ top: step.getBoundingClientRect().top + scrollY + step.offsetHeight / 2 - innerHeight / 2, behavior: 'instant' });
    }, index);
    await expect(page.locator(`[data-frame="${index}"]`)).toHaveClass(/is-active/);
  }
  // Feature bar: vertical scroll moves the gallery sideways; the tabs follow.
  await scrollToProgress(page, '#features', 0);
  await expect(page.locator('[data-fb="0"]')).toHaveAttribute('aria-current', 'true');
  await scrollToProgress(page, '#features', 1);
  await expect(page.locator('#fb-insights')).toHaveClass(/is-active/);
  await expect(page.locator('[data-fb="5"]')).toHaveAttribute('aria-current', 'true');
  expect(await page.locator('#fb-insights').evaluate(panel => { const r = panel.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })).toBe(true);
  await page.screenshot({ path: 'review/screenshots/motion-features.png' });
  // Appearance: the frame opens and Midnight wipes all the way across.
  await scrollToProgress(page, '#appearance', 1);
  await expect.poll(() => cssVar(page, '#appearance', '--wipe')).toBe(0);
  // Editor: real captures for monitors, layers, cut, motion and shape, ending on the export sheet.
  const shots = ['editor', 'editor-layers', 'editor-cut', 'editor-inspector', 'editor-shape'];
  for (const [index, progress] of [.1, .3, .5, .7, .85].entries()) {
    await scrollToProgress(page, '.editor-run', progress);
    await expect(page.locator('.ed-step').nth(index)).toHaveClass(/is-active/);
    await expect(page.locator(`.ed-shot[data-shot="${shots[index]}"]`)).toHaveClass(/is-active/);
    await expect(page.locator('.ed-shot.is-active')).toHaveCount(1);
    await page.screenshot({ path: `review/screenshots/motion-editor-${index}.png` });
  }
  await scrollToProgress(page, '.editor-run', .99);
  await expect(page.locator('.ed-shot[data-shot="editor-export"]')).toHaveClass(/is-active/);
  await expect(page.locator('.ed-shot.is-active')).toHaveJSProperty('complete', true);
  expect(await page.locator('.ed-focus').evaluate(el => parseFloat(getComputedStyle(el).width))).toBeGreaterThan(40);
  // The download mark becomes a 3D emblem.
  await page.locator('#download').scrollIntoViewIfNeeded();
  await expect(page.locator('#emblem-stage')).toHaveAttribute('data-renderer', 'webgl', { timeout: 20000 });
  await page.screenshot({ path: 'review/screenshots/emblem.png' });
  await page.locator('.site-footer a[href="./credits.html"]').click();
  await expect(page).toHaveTitle('Credits — Kobra');
  await expect(page.getByRole('heading', { name: 'Sample films' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the CSS display still tells the story when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (context: string, ...args: unknown[]) {
      if (context.includes('webgl')) return null;
      return original.apply(this, [context, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('./');
  await expect(page.locator('#hero-stage')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('.hero-fallback')).toHaveCSS('opacity', '1');
  await expect(page.locator('#hero-stage canvas')).toHaveCount(0);
  await scrollToProgress(page, '#top', .9);
  await expect.poll(() => deviceGrowth(page)).toBeGreaterThan(1.02);
  await expect(page.locator('.device')).toHaveCSS('opacity', '1');
  await page.locator('#download').scrollIntoViewIfNeeded();
  await expect(page.locator('#emblem-stage')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('#emblem-stage .download-icon')).toHaveCSS('opacity', '1');
  await expect(page.getByRole('link', { name: 'Download for Windows' }).last()).toHaveAttribute('href', SETUP);
});

test('content and navigation work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.SHOWCASE_URL || 'http://127.0.0.1:4174');
  await expect(page.locator('html')).not.toHaveClass(/\bjs\b/);
  await expect(page.locator('#hero-title')).toBeVisible();
  await expect(page.locator('.hero-fallback')).toBeVisible();
  for (const step of await page.locator('.feature-step').all()) await expect(step).toBeVisible();
  for (const panel of await page.locator('.fb-panel').all()) await expect(panel).toBeVisible();
  for (const step of await page.locator('.ed-step').all()) await expect(step).toBeVisible();
  await expect(page.locator('#mode-studio')).toBeVisible();
  await expect(page.locator('.folder-file').first()).toHaveCSS('opacity', '1');
  await expect(page.locator('.theme-toggle')).toBeHidden();
  // Claims from src/content.ts are part of the static page.
  await expect(page.locator('#fb-clips')).toContainText('Make a short clip or a GIF');
  await expect(page.getByRole('link', { name: /Download for Windows/ }).last()).toHaveAttribute('href', SETUP);
  await page.locator('.hero-actions').getByRole('link', { name: 'Download for Windows' }).click();
  await expect(page.locator('#download-title')).toBeInViewport();
  await context.close();
});

test('keyboard: feature bar tabs, segmented controls and focus rings', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.locator('[data-fb="3"]').focus();
  await expect(page.locator('[data-fb="3"]')).toBeFocused();
  expect(await page.locator('[data-fb="3"]').evaluate(link => getComputedStyle(link).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.locator('#fb-scenes')).toBeInViewport();
  await page.locator('[data-picture="cinema"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-picture="cinema"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.locator('.picture-modes .seg-thumb').evaluate(thumb => getComputedStyle(thumb).getPropertyValue('--x'))).not.toBe('0px');
});
