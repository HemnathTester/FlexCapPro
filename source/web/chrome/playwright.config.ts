import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const root = path.resolve(__dirname, '../../..');
const product = process.env.PRODUCT ?? 'chrome';
const runId = process.env.RUN_ID ?? 'local';

// Specs are one file per scenario ID under specs/<module>/ (RULES.md §3.5).
export default defineConfig({
  testDir: './specs',
  // A failing scenario never stops the run: the next one continues (RULES.md §2).
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 5 * 60 * 1000,
  expect: { timeout: 10000 },
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(root, 'executions', runId, 'playwright-results.json') }],
  ],
  outputDir: path.join(root, 'reports', 'results', product, runId),
  use: {
    baseURL: process.env.BASE_URL,
    // Evidence on every scenario, not just failures (RULES.md §6).
    screenshot: 'on',
    trace: 'retain-on-failure',
    headless: process.env.HEADED !== '1',
    launchOptions: { slowMo: Number(process.env.SLOWMO ?? 0) },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
});
