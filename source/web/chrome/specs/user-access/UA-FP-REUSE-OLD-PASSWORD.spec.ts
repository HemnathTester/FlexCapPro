import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, startForgotPassword, forgotOtp, inboxOf, snap, submitForgotOtp, reachedChangePassword, setNewPassword } from '../../utils/flows';

test('UA-FP-REUSE-OLD-PASSWORD Reusing the previous password as the new password is rejected', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'REUSEPW' });
  const known = await snap(browser, inboxOf(acc.email), 'otp');
  await startForgotPassword(page, acc.email);
  await submitForgotOtp(page, await forgotOtp(browser, inboxOf(acc.email), known));
  expect(await reachedChangePassword(page), 'a correct OTP must lead to the change-password step').toBe(true);

  const r = await setNewPassword(page, acc.password); // the current password
  expect(r.accepted, `the current password was accepted as the "new" password: ${JSON.stringify(r.calls)}`).toBe(false);
});
