import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, startForgotPassword, getMail, inboxOf, snap, resetLinkOf } from '../../utils/flows';

test('UA-FP-RESET-PAGE-WITHOUT-TOKEN The reset page cannot be used directly without the emailed token', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'NOTOKEN' });
  const known = await snap(browser, inboxOf(acc.email));
  await startForgotPassword(page, acc.email);
  const mail = await getMail(browser, inboxOf(acc.email), known, /reset|password/i, 'the password reset email (link)');
  const link = new URL(resetLinkOf(mail.links));

  // Same page, token and any other parameters removed.
  const bare = `${link.origin}${link.pathname}`;
  await page.goto(bare);
  await page.waitForTimeout(2000);
  const formShown = (await page.locator('input[type=password]').count()) > 0 && !/\/login/.test(page.url());
  expect(formShown, `the reset form was shown without a token at ${bare}`).toBe(false);
});
