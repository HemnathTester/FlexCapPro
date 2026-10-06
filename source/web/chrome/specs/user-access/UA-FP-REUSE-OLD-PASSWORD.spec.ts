import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, startForgotPassword, getMail, inboxOf, snap, resetLinkOf, setNewPassword } from '../../utils/flows';

test('UA-FP-REUSE-OLD-PASSWORD Reusing the previous password is rejected', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'REUSEPW' });
  const known = await snap(browser, inboxOf(acc.email));
  await startForgotPassword(page, acc.email);
  const mail = await getMail(browser, inboxOf(acc.email), known, /reset|password/i, 'the password reset email (link)');
  await page.goto(resetLinkOf(mail.links));
  const r = await setNewPassword(page, acc.password); // the current password
  expect(r.accepted, `the current password was accepted as the "new" password: ${JSON.stringify(r.calls)}`).toBe(false);
});
