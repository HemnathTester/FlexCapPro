import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, startForgotPassword, forgotOtp, inboxOf, snap, submitForgotOtp, reachedChangePassword, setNewPassword, passwordWorks } from '../../utils/flows';

// UAT sends a "Forgot Password OTP" email (6 digits) even though the page text promises a link.
test('UA-FP-FULL-RESET-BY-OTP Full reset: email, OTP, new password; login works with the new password and fails with the old', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'FULLRESET' });
  const known = await snap(browser, inboxOf(acc.email), 'otp');
  const calls = await startForgotPassword(page, acc.email);
  expect(calls.some((c) => c.status >= 200 && c.status < 300), `forgot-password request: ${JSON.stringify(calls)}`).toBe(true);

  const otp = await forgotOtp(browser, inboxOf(acc.email), known);
  await submitForgotOtp(page, otp);
  expect(await reachedChangePassword(page), 'a correct OTP must lead to the change-password step').toBe(true);

  const NEW = 'New@12345';
  const r = await setNewPassword(page, NEW);
  expect(r.accepted, `the new password was not accepted: ${JSON.stringify(r.calls)} ${r.seen.slice(0, 200)}`).toBe(true);

  expect(await passwordWorks(page, acc.email, NEW), 'the NEW password must work').toBe(true);
  expect(await passwordWorks(page, acc.email, acc.password), 'the OLD password must stop working').toBe(false);
});
