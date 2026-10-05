import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

const ROOT = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(ROOT, '.env') });

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: path.join(ROOT, 'reports/results/playwright') }],
    ['html', { outputFolder: path.join(ROOT, 'reports/reports/playwright-html'), open: 'never' }],
  ],
  use: {
    baseURL: process.env.WEB_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
