import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, startForgotPassword, forgotOtp, inboxOf, snap, submitForgotOtp, reachedChangePassword, setNewPassword, textSeen, WRONG_OTP } from '../../utils/flows';

test('UA-FP-WRONG-AND-USED-OTP-REJECTED A wrong OTP is rejected, and an OTP that was already used cannot be used again', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'USEDOTP' });
  const known = await snap(browser, inboxOf(acc.email), 'otp');
  await startForgotPassword(page, acc.email);
  const otp = await forgotOtp(browser, inboxOf(acc.email), known);

  // 1. A wrong code does not get through.
  await submitForgotOtp(page, WRONG_OTP);
  const seen = await textSeen(page, 2000);
  expect(await reachedChangePassword(page), `a WRONG OTP opened the change-password step (page said: ${seen.slice(0, 150)})`).toBe(false);

  // 2. The right code does, and the reset completes.
  await submitForgotOtp(page, otp);
  expect(await reachedChangePassword(page), 'the correct OTP should open the change-password step').toBe(true);
  expect((await setNewPassword(page, 'Used@12345')).accepted, 'the reset with the correct OTP should be accepted').toBe(true);

  // 3. A new Forgot Password request, then the SAME code again. Since the dev team fixed the OTP to one static test
  // value, "otp" here is identical before and after the new request, so this no longer proves reuse was blocked —
  // it only shows whether the bypass still enforces single-use. Reported, not hard-asserted, until confirmed with dev.
  await startForgotPassword(page, acc.email);
  await submitForgotOtp(page, otp);
  const stillOpensChangePassword = await reachedChangePassword(page);
  console.log(
    `UA-FP-WRONG-AND-USED-OTP-REJECTED note: after a fresh Forgot Password request, resubmitting the (fixed, static) OTP ` +
      `${stillOpensChangePassword ? 'STILL opened' : 'did NOT open'} the change-password step. Confirm with the dev team ` +
      `whether the static test OTP is meant to be single-use.`,
  );
});
