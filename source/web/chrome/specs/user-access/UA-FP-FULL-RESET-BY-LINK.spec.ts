import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, startForgotPassword, getMail, inboxOf, snap, resetLinkOf, setNewPassword, passwordWorks } from '../../utils/flows';

test('UA-FP-FULL-RESET-BY-LINK Full reset by emailed link; login works with the new password and fails with the old', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'FULLRESET' });
  const known = await snap(browser, inboxOf(acc.email));
  const calls = await startForgotPassword(page, acc.email);
  expect(calls.some((c) => c.status >= 200 && c.status < 300), `forgot-password request: ${JSON.stringify(calls)}`).toBe(true);

  const mail = await getMail(browser, inboxOf(acc.email), known, /reset|password/i, 'the password reset email (link)');
  await page.goto(resetLinkOf(mail.links));
  const NEW = 'New@12345';
  const r = await setNewPassword(page, NEW);
  expect(r.accepted, `reset was not accepted: ${JSON.stringify(r.calls)} ${r.seen.slice(0, 200)}`).toBe(true);

  expect(await passwordWorks(page, acc.email, NEW), 'the NEW password must work').toBe(true);
  expect(await passwordWorks(page, acc.email, acc.password), 'the OLD password must stop working').toBe(false);
});
