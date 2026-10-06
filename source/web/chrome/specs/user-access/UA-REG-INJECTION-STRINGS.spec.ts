import { test, expect } from '../../fixtures/base';
import { fillRegister, submitRegister, uniqueInbox } from '../../utils/flows';

// Pass = injection strings are rejected, or accepted as plain text with nothing executed and no server error.
test('UA-REG-INJECTION-STRINGS Script/SQL injection strings in text fields are rejected or stored and rendered inertly', async ({ page }) => {
  let dialogs = 0;
  page.on('dialog', async (d) => {
    dialogs++;
    await d.dismiss();
  });
  const payloads = ['<script>alert(1)</script>', '"><img src=x onerror=alert(1)>', "'; DROP TABLE users; --", "' OR '1'='1"];
  const failures: string[] = [];
  for (const p of payloads) {
    await fillRegister(page, { email: `${uniqueInbox('INJECT')}@yopmail.com`, business: p });
    const res = await submitRegister(page);
    await page.waitForTimeout(1500);
    if (res && res.status >= 500) failures.push(`"${p}": server error ${res.status} (${res.body?.message ?? ''})`);
    const html = await page.content();
    if (/<script>alert\(1\)<\/script>/i.test(html.replace(/&lt;script&gt;/g, ''))) failures.push(`"${p}": raw script tag reflected into the page`);
  }
  expect(dialogs, 'a script from an input field executed').toBe(0);
  expect(failures, failures.join(' || ')).toEqual([]);
});
