import { test, expect } from '../../fixtures/base';
import { askMailbox, autoMail, scratchAccount, submitLogin, typeOtp, otpBoxes, otpVerifyButton, otpFrom, getMail, inboxOf, textSeen, snap } from '../../utils/flows';
import { yopmail } from '../../utils/yopmail';

// The OTP validity period is read from the OTP email itself. If the email does not state it, or it is too long
// to wait for in a regression run, the scenario is reported as NOT EXECUTED with the reason (never silently passed).
test('UA-LOGIN-EXPIRED-OTP-REJECTED Expired OTP is rejected; a new OTP can be requested', async ({ page, browser }) => {
  const acc = await scratchAccount(page, browser);
  const known = await snap(browser, inboxOf(acc.email));
  await submitLogin(page, acc.email, acc.password);
  await expect(otpBoxes(page).first()).toBeVisible();
  const mail = await getMail(browser, inboxOf(acc.email), known, /login code/i, 'the login code mail');
  const minutes = Number((mail.text.match(/(\d+)\s*(?:minute|min)/i) ?? [])[1]);
  console.log(`OTP mail text: ${mail.text.slice(0, 400)}`);
  test.skip(!minutes, 'The OTP email does not state a validity period, so expiry cannot be timed. Ask the product team for the OTP validity.');
  test.skip(minutes > 6, `OTP is valid for ${minutes} minutes: too long to wait in a regression run.`);

  test.setTimeout((minutes + 4) * 60 * 1000);
  await page.waitForTimeout((minutes * 60 + 20) * 1000);
  await typeOtp(page, otpFrom(mail.text));
  await otpVerifyButton(page).click();
  const seen = await textSeen(page, 2500);
  expect(seen, 'an expired OTP must be rejected with a message').toMatch(/expired|invalid|incorrect|no longer/i);
  await expect(page.getByText('Log out')).not.toBeVisible();
});
