import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://turnero-front-qa.onrender.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  projects: [
    {
      name: 'integracion',
      testMatch: /.*api\.spec\.ts/,
    },
    {
      name: 'e2e',
      testMatch: /.*turnero\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
