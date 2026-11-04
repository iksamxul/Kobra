import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

for (const theme of ['light', 'dark'] as const) {
  for (const width of [1440, 1024, 768, 390, 320]) {
    test(`${theme} ${width}px: layout, images and product interactions`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('./');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('#hero-title')).toBeVisible();
      await expect(page.locator('#hero-stage canvas')).toHaveCount(0);
      await expect(page.locator('.hero-fallback')).toBeVisible();
      for (const section of ['#experience', '#scroll-story', '#everyday', '#modes', '#editor', '#details', '#download']) {
        await page.locator(section).scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      }
      await expect(page.locator('.story-step')).toHaveCount(3);
      for (const step of await page.locator('.story-step').all()) await expect(step).toHaveAttribute('aria-hidden', 'false');
      // Reduced motion shows every Editor step and the finished timeline with its outputs.
      for (const step of await page.locator('.editor-step').all()) { await expect(step).toBeVisible(); await expect(step).toHaveAttribute('aria-hidden', 'false'); }
      await expect(page.locator('.editor-exports span').first()).toHaveCSS('opacity', '1');
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
      await page.locator('.mini-search input').fill('snow');
      await expect(page.locator('.transcript-list li:visible')).toHaveCount(1);
      await page.locator('.mini-search input').fill('');
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

test('motion, 3D, keyboard, theme persistence and credits', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#hero-stage')).toHaveAttribute('data-renderer', 'webgl', { timeout: 20000 });
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.theme-toggle').click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(page.locator('#hero-stage')).toHaveAttribute('data-renderer', 'webgl');
  await mkdir('review/screenshots', { recursive: true });
  await page.screenshot({ path: 'review/screenshots/desktop-3d-hero.png' });
  for (const [index, progress] of [0, .5, 1].entries()) {
    await page.evaluate(value => {
      const story = document.querySelector('#scroll-story')!;
      window.scrollTo({ top: story.getBoundingClientRect().top + scrollY - 73 + (story.getBoundingClientRect().height - innerHeight) * value, behavior: 'instant' });
    }, progress);
    await expect(page.locator(`.story-step[data-step="${index}"]`)).toHaveClass(/is-active/);
    await page.screenshot({ path: `review/screenshots/story-${index}.png` });
  }
  // The Editor sequence: clips gather, the playhead plays the edit, then every output appears.
  for (const [index, progress] of [.15, .5, .95].entries()) {
    await page.evaluate(value => {
      const section = document.querySelector('#editor')!;
      window.scrollTo({ top: section.getBoundingClientRect().top + scrollY - 73 + (section.getBoundingClientRect().height - innerHeight) * value, behavior: 'instant' });
    }, progress);
    await expect(page.locator('.editor-step').nth(index)).toHaveClass(/is-active/);
    await page.screenshot({ path: `review/screenshots/editor-${index}.png` });
  }
  expect(Number(await page.locator('.editor-exports span').last().evaluate(el => el.style.getPropertyValue('--eo')))).toBeGreaterThan(.9);
  // The download mark becomes a 3D emblem.
  await page.locator('#download').scrollIntoViewIfNeeded();
  await expect(page.locator('#emblem-stage')).toHaveAttribute('data-renderer', 'webgl', { timeout: 20000 });
  await page.screenshot({ path: 'review/screenshots/emblem.png' });
  await page.locator('.site-footer a[href="./credits.html"]').click();
  await expect(page).toHaveTitle('Credits — Kobra');
  await expect(page.getByRole('heading', { name: 'Sample films' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('fallback remains usable when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (context: string, ...args: unknown[]) {
      if (context.includes('webgl')) return null;
      return original.apply(this, [context, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('./');
  await expect(page.locator('#hero-stage')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('.hero-fallback')).toHaveCSS('opacity', '1');
  await page.locator('#download').scrollIntoViewIfNeeded();
  await expect(page.locator('#emblem-stage')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('#emblem-stage .download-icon')).toHaveCSS('opacity', '1');
  await expect(page.getByRole('link', { name: /Meet Kobra/ })).toBeVisible();
});

test('content and navigation work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(process.env.SHOWCASE_URL || 'http://127.0.0.1:4174');
  await expect(page.locator('#hero-title')).toBeVisible();
  for (const step of await page.locator('.story-step').all()) await expect(step).toBeVisible();
  for (const step of await page.locator('.editor-step').all()) await expect(step).toBeVisible();
  await expect(page.locator('.folder-file').first()).toHaveCSS('opacity', '1');
  await page.getByRole('link', { name: /Meet Kobra/ }).click();
  await expect(page.locator('#download-title')).toBeInViewport();
  await context.close();
});
