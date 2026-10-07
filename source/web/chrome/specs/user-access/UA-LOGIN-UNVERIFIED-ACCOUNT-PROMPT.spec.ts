import { test, expect } from '../../fixtures/base';
import { fillRegister, submitRegister, submitLogin, uniqueInbox, verificationPopup, otpBoxes } from '../../utils/flows';

// Manual run TC_LOGIN_UNVER_01 showed "Invalid credentials" here; the PRD/Manual expectation is the verification prompt.
test('UA-LOGIN-UNVERIFIED-ACCOUNT-PROMPT Login by a registered but unverified account shows the verification prompt, not an invalid-credentials error @known-defect', async ({ page }) => {
  const email = `${uniqueInbox('UNVERIFIED')}@yopmail.com`;
  await fillRegister(page, { email });
  expect((await submitRegister(page))?.status).toBe(200);

  await submitLogin(page, email, 'Test@1234');
  await expect(verificationPopup(page), 'unverified login must show the verification prompt').toBeVisible();
  await expect(page.getByText(/Invalid credentials/i)).not.toBeVisible();
  await expect(otpBoxes(page).first(), 'an unverified account must not reach the OTP step').not.toBeVisible();
});
