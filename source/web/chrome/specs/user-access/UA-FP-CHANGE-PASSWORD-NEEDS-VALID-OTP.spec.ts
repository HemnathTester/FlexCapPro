import { test, expect } from '../../fixtures/base';
import { scratchAccount, startForgotPassword, otpBoxes, otpVerifyButton, typeOtp, changePasswordBoxes, textSeen, STATIC_OTP, WRONG_OTP } from '../../utils/flows';

// No real OTP is needed for this scenario: it proves the change-password step cannot be reached with a WRONG code.
test('UA-FP-CHANGE-PASSWORD-NEEDS-VALID-OTP The change-password step is not reachable without the correct OTP', async ({ page, browser }) => {
  const acc = await scratchAccount(page, browser);
  await startForgotPassword(page, acc.email);

  await expect(otpBoxes(page).first(), 'the OTP boxes should appear after submitting the email').toBeVisible();
  expect(await changePasswordBoxes(page).count(), 'password fields were visible before any OTP was entered').toBe(0);
  await expect(otpVerifyButton(page), 'Verify must stay disabled until all 6 digits are entered').toBeDisabled();

  // Wrong codes never open the change-password step. (STATIC_OTP is the fixed, CORRECT test OTP: excluded here on purpose.)
  for (const bad of [WRONG_OTP, '123456', '999999'].filter((c) => c !== STATIC_OTP)) {
    await typeOtp(page, bad);
    await otpVerifyButton(page).click();
    await textSeen(page, 1200);
    expect(await changePasswordBoxes(page).count(), `the wrong OTP ${bad} opened the change-password step`).toBe(0);
  }
});
