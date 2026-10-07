import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, startForgotPassword, getMail, inboxOf, snap, resetLinkOf, setNewPassword, passwordWorks } from '../../utils/flows';

// UAT resets by emailed LINK (not by OTP as the manual suite assumed), so this scenario covers the link:
// a tampered link must not reset the password, and a used link must not work a second time.
test('UA-FP-TAMPERED-AND-USED-LINK Tampered reset link is rejected and a used reset link cannot be used again', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'TAMPERLINK' });
  const known = await snap(browser, inboxOf(acc.email));
  await startForgotPassword(page, acc.email);
  const mail = await getMail(browser, inboxOf(acc.email), known, /reset|password/i, 'the password reset email (link)');
  const link = resetLinkOf(mail.links);

  // 1. Tampered token.
  const tampered = link.replace(/(token=|\/)([A-Za-z0-9_\-%=.]{8,})(&|$)/, (_m, a, t, b) => `${a}${t.split('').reverse().join('')}${b}`);
  expect(tampered, 'could not build a tampered link from: ' + link).not.toBe(link);
  await page.goto(tampered);
  await page.waitForTimeout(2000);
  let tamperedAccepted = false;
  if ((await page.locator('input[type=password]').count()) > 0) tamperedAccepted = (await setNewPassword(page, 'Tamper@12345')).accepted;
  expect(tamperedAccepted, 'a tampered link allowed a password change').toBe(false);
  expect(await passwordWorks(page, acc.email, 'Tamper@12345'), 'password set through a tampered link must not work').toBe(false);

  // 2. The real link works once.
  await page.goto(link);
  const first = await setNewPassword(page, 'First@12345');
  expect(first.accepted, `first use of the real link failed: ${JSON.stringify(first.calls)}`).toBe(true);

  // 3. A second use must be refused.
  await page.goto(link);
  await page.waitForTimeout(1500);
  let secondAccepted = false;
  if ((await page.locator('input[type=password]').count()) > 0) secondAccepted = (await setNewPassword(page, 'Second@12345')).accepted;
  expect(secondAccepted, 'the one-time reset link was accepted a second time').toBe(false);
  expect(await passwordWorks(page, acc.email, 'Second@12345'), 'password from the reused link must not work').toBe(false);
});
