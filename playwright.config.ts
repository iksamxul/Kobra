import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './review/test-results',
  timeout: 45000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.SHOWCASE_URL || 'http://127.0.0.1:4174',
    channel: process.env.SHOWCASE_BROWSER || undefined,
    screenshot: 'only-on-failure',
  },
  webServer: process.env.SHOWCASE_URL ? undefined : {
    command: 'npm run preview -- --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: !process.env.CI,
  },
});
