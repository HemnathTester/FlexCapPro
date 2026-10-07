import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, submitLogin, typeOtp, otpBoxes, otpVerifyButton, otpFrom, getMail, inboxOf, textSeen, snap } from '../../utils/flows';
import { yopmail } from '../../utils/yopmail';

// Disposable account: its OTP is locked by this scenario. Limit is unknown, so 6 wrong attempts are made.
test('UA-LOGIN-LOCKOUT-AFTER-WRONG-OTPS Repeated wrong OTPs lock further OTP attempts', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'LOCKOTP' });
  const known = await snap(browser, inboxOf(acc.email));
  await submitLogin(page, acc.email, acc.password);
  await expect(otpBoxes(page).first()).toBeVisible();
  const mail = await getMail(browser, inboxOf(acc.email), known, /login code/i, 'the login code mail');

  for (let i = 0; i < 6; i++) {
    await typeOtp(page, '000000');
    await otpVerifyButton(page).click();
    await page.waitForTimeout(1200);
  }
  // Now the CORRECT OTP must be refused.
  await typeOtp(page, otpFrom(mail.text));
  const verify = otpVerifyButton(page);
  if (await verify.isEnabled()) await verify.click();
  const seen = await textSeen(page, 3000);
  const gotIn = await page.getByText('Log out').isVisible();
  expect(gotIn, `the correct OTP was still accepted after 6 wrong attempts (page said: ${seen.slice(0, 200)})`).toBe(false);
});
