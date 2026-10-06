import { test, expect } from '../../fixtures/base';
import { verifiedHeading, fillRegister, submitRegister, uniqueInbox, inboxOf, getMail, verifyLinkOf, submitLogin, verificationPopup, otpBoxes, snap } from '../../utils/flows';
import { yopmail } from '../../utils/yopmail';

test('UA-REG-VERIFY-LINK-ONCE-AND-TAMPERED Verification link verifies the account once; a second use and a tampered link are rejected', async ({ page, browser }) => {
  const email = `${uniqueInbox('VERIFYLINK')}@yopmail.com`;
  const inbox = inboxOf(email);
  const known = await snap(browser, inbox);
  await fillRegister(page, { email });
  expect((await submitRegister(page))?.status).toBe(200);
  const mail = await getMail(browser, inbox, known, /verify your email/i, 'the "Verify Your Email" mail');
  const link = verifyLinkOf(mail.links, inbox);

  // 1. Tampered token is rejected: the account stays unverified (login still asks for verification).
  const tampered = link.replace(/token=([^&]{6})/, (_m, t) => `token=${t.split('').reverse().join('')}`);
  await page.goto(tampered);
  await page.getByRole('button', { name: /verify your email/i }).click().catch(() => undefined);
  await page.waitForTimeout(2500);
  const tamperedSaysVerified = await verifiedHeading(page).isVisible();
  expect(tamperedSaysVerified, 'a tampered link verified the account').toBe(false);
  await submitLogin(page, email, 'Test@1234');
  await expect(verificationPopup(page), 'account must still be unverified after a tampered link').toBeVisible();

  // 2. The real link verifies once.
  await page.goto(link);
  await page.getByRole('button', { name: /verify your email/i }).click();
  await expect(verifiedHeading(page)).toBeVisible();
  await submitLogin(page, email, 'Test@1234');
  await expect(otpBoxes(page).first(), 'a verified account should reach the OTP step').toBeVisible();

  // 3. Using the same link a second time must not present a fresh success.
  await page.goto(link);
  await page.getByRole('button', { name: /verify your email/i }).click().catch(() => undefined);
  await page.waitForTimeout(2500);
  const secondShowsFreshSuccess = await verifiedHeading(page).isVisible();
  expect(secondShowsFreshSuccess, 'the one-time link was accepted a second time and showed the success message again').toBe(false);
});
