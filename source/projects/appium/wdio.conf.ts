import path from 'path';
import dotenv from 'dotenv';

export const ROOT = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(ROOT, '.env') });

const RESULTS_DIR = path.join(ROOT, 'reports/results/appium');

// Base config — capabilities live in wdio.android.conf.ts / wdio.ios.conf.ts.
export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./specs/**/*.spec.ts'],
  maxInstances: 1,
  capabilities: [],
  logLevel: 'info',
  outputDir: path.join(ROOT, 'executions/logs/appium'),
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 120000 },
  reporters: [
    'spec',
    ['allure', {
      outputDir: RESULTS_DIR,
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }],
  ],
  // Uses the globally installed Appium 3 server and its drivers (`appium driver list`).
  services: [['appium', { command: 'appium' }]],
  afterTest: async function (test, _context, { passed }) {
    if (!passed) {
      await browser.saveScreenshot(
        path.join(RESULTS_DIR, `failure-${test.title.replace(/\W+/g, '_')}.png`)
      );
    }
  },
};
