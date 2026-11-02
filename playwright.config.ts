import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    channel: 'chrome',
    viewport: { width: 1440, height: 900 }
  },
  webServer: {
    command: 'node tools/serve-prototype.mjs',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: false,
    timeout: 10_000
  },
  reporter: [['list']],
  workers: 2
});
