import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Every spec imports test/expect from here. On any unexpected outcome it saves a screen-hierarchy dump next to the
// screenshot, as RULES.md §6 requires (screenshot is taken by the config for every scenario).
export const test = base.extend<{ evidence: void }>({
  evidence: [
    async ({ page }, use, testInfo) => {
      await use();
      if (testInfo.status !== testInfo.expectedStatus) {
        try {
          fs.mkdirSync(testInfo.outputDir, { recursive: true });
          const yml = await page.locator('body').ariaSnapshot({ timeout: 5000 });
          fs.writeFileSync(path.join(testInfo.outputDir, 'hierarchy.yml'), `# ${testInfo.title}\n# ${page.url()}\n${yml}`);
        } catch {
          /* page may already be closed */
        }
      }
    },
    { auto: true },
  ],
});

export { expect };
