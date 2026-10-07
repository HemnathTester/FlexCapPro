import { test, expect } from '../../fixtures/base';
import { scratchAccount, submitLogin, typeOtp, otpBoxes, otpVerifyButton, textSeen } from '../../utils/flows';

test('UA-LOGIN-WRONG-OTP-REJECTED Wrong OTP is rejected and no session is created', async ({ page, browser }) => {
  const acc = await scratchAccount(page, browser);
  await submitLogin(page, acc.email, acc.password);
  await expect(otpBoxes(page).first()).toBeVisible();

  await typeOtp(page, '000000');
  await otpVerifyButton(page).click();
  const seen = await textSeen(page, 2500);
  expect(seen, 'a wrong OTP must show an error').toMatch(/invalid|incorrect|wrong|expired|not valid|try again/i);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Log out')).not.toBeVisible();

  // No session was created: a protected page still sends the user to Login.
  await page.goto('/airlines/onBoarding');
  await expect(page).toHaveURL(/\/login/);
});
