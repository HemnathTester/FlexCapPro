import { test as base, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import fs from 'node:fs';
import path from 'node:path';
import { closeMailWindow } from '../utils/mailWindow';
import { startRecording, stopRecording } from './stepRecorder';

// Every spec imports test/expect from here. It does two things for every scenario:
//  1. Labels it for the Allure report: module, spec file, feature (screen), type (Positive/Negative/Edge), tags.
//  2. On any unexpected outcome saves a screen-hierarchy dump (RULES.md §6) next to the screenshot and attaches it to the report.
// The screenshot itself is taken by the Playwright config for every scenario.

const root = path.resolve(process.cwd(), '..', '..', '..');

function readCatalog(): Record<string, { type: string }> {
  const map: Record<string, { type: string }> = {};
  try {
    const text = fs.readFileSync(path.join(root, 'implementation', 'plans', 'scenario-catalog.md'), 'utf8');
    for (const line of text.split('\n')) {
      const c = line.split('|').map((s) => s.trim());
      if (/^[A-Z]{2,5}-[A-Z0-9-]+$/.test(c[1] ?? '')) map[c[1]] = { type: c[4] };
    }
  } catch {
    /* catalog is optional for labelling */
  }
  return map;
}
const catalog = readCatalog();

const FEATURE: Record<string, string> = {
  // user-access
  REG: 'Register', LOGIN: 'Login', FP: 'Forgot Password',
  // business-onboarding
  BIZINFO: 'Business Info', LOGO: 'Business Logo', UPLOAD: 'Document Uploads', STAKEHOLDER: 'Stakeholder Details', SIGNATORY: 'Authorized Signatory',
  BANK: 'Bank Account', ADMIN: 'Account Admin', INVOICE: 'Invoice Templates', TERMS: 'Terms & Conditions', STEPPER: 'Stepper & Progress',
  STEP: 'Stepper & Progress', SAVE: 'Save Draft & Resume', REVIEW: 'Review & Submit', SUPPLIER: 'Submission', BUYER: 'Submission',
  ALTERNATE: 'Alternate Email', STATUS: 'Status Navigation',
  // sanity
  FLEXCAP: 'Sanity',
};

export const test = base.extend<{ evidence: void }, { mailWindow: void }>({
  // worker-scoped: closes the yopmail window opened for the person when the run ends
  mailWindow: [
    async ({}, use) => {
      await use();
      await closeMailWindow();
    },
    { scope: 'worker', auto: true },
  ],
  evidence: [
    async ({ page }, use, testInfo) => {
      const file = path.relative(path.resolve(process.cwd(), 'specs'), testInfo.file).replace(/\\/g, '/');
      const [moduleName] = file.split('/');
      const specName = path.basename(file).replace(/\.spec\.ts$/, '');
      const id = (testInfo.title.match(/^([A-Z]{2,5}-[A-Z0-9-]+)/) ?? [])[1] ?? specName;
      const area = (id.split('-')[1] ?? '').toUpperCase();
      const type = catalog[id]?.type;

      await allure.epic('FlexCapPro (UAT)');
      await allure.parentSuite(moduleName);
      await allure.suite(specName);
      if (FEATURE[area]) await allure.feature(FEATURE[area]);
      if (type) {
        await allure.story(type);
        await allure.tag(type);
      }
      if (/@known-defect/.test(testInfo.title)) await allure.tag('known-defect');
      if (/@slow/.test(testInfo.title)) await allure.tag('slow');
      await allure.tag(moduleName);
      await allure.parameter('Run ID', process.env.RUN_ID ?? 'local');
      await allure.parameter('Environment', process.env.TARGET_ENV ?? 'UAT');

      startRecording(page, id); // every action from here on is listed with a screenshot (Excel report, Steps sheet)
      await use();
      stopRecording();

      if (testInfo.status !== testInfo.expectedStatus) {
        try {
          fs.mkdirSync(testInfo.outputDir, { recursive: true });
          const yml = await page.locator('body').ariaSnapshot({ timeout: 5000 });
          const body = `# ${testInfo.title}\n# ${page.url()}\n${yml}`;
          fs.writeFileSync(path.join(testInfo.outputDir, 'hierarchy.yml'), body);
          await testInfo.attach('screen-hierarchy', { body, contentType: 'text/plain' });
        } catch {
          /* page may already be closed */
        }
      }
    },
    { auto: true },
  ],
});

export { expect };
