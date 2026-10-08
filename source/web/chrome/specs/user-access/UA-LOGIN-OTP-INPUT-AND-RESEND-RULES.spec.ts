import { test, expect } from '../../fixtures/base';
import { scratchAccount, submitLogin, otpBoxes, otpVerifyButton, typeOtp, textSeen, STATIC_OTP } from '../../utils/flows';

test('UA-LOGIN-OTP-INPUT-AND-RESEND-RULES OTP input rules: verify blocked until complete, non-numeric rejected, paste fills all boxes, resend disabled during countdown, OTP still works after resend', async ({ page, browser }) => {
  test.setTimeout(6 * 60 * 1000);
  const acc = await scratchAccount(page, browser);
  await submitLogin(page, acc.email, acc.password);
  const boxes = otpBoxes(page);
  await expect(boxes.first()).toBeVisible();
  await expect(boxes).toHaveCount(6);
  const verify = otpVerifyButton(page);
  const values = async () => (await boxes.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).join('');

  // 1. Verify is blocked until all six digits are entered.
  await expect(verify).toBeDisabled();
  for (let i = 0; i < 5; i++) await boxes.nth(i).fill(String(i + 1));
  await expect(verify, 'Verify must stay disabled with 5 of 6 digits').toBeDisabled();
  await boxes.nth(5).fill('6');
  await expect(verify, 'Verify must enable once 6 digits are entered').toBeEnabled();

  // 2. Non-numeric characters are not accepted (typed with the keyboard, as a user would).
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill('');
  await boxes.first().click();
  await page.keyboard.type('abc!@#');
  expect(await values(), 'letters/symbols must not appear in the OTP boxes').toMatch(/^\d*$/);

  // 3. Pasting a full OTP fills all six boxes.
  for (let i = 0; i < 6; i++) await boxes.nth(i).fill('');
  await boxes.first().click();
  await boxes.first().evaluate((el) => {
    const dt = new DataTransfer();
    dt.setData('text', '123456');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(500);
  expect(await values(), 'pasting 123456 must fill every box').toBe('123456');

  // 4. Resend is unavailable while the countdown runs, and available after it.
  await expect(page.getByText(/Resend OTP in\s*\d{2}:\d{2}/)).toBeVisible();
  await expect(page.getByText(/Resend OTP in\s*\d{2}:\d{2}/)).toBeHidden({ timeout: 90000 });
  const resend = page.getByText(/^\s*Resend OTP\s*$/);
  await expect(resend, 'Resend OTP link must be available after the countdown').toBeVisible();
  await resend.click();

  // 5. The fixed test OTP still logs in after a resend.
  // (OTP is now a static test value set by the dev team, so "a different code is issued on resend" no longer applies;
  // what matters is that resend doesn't break the login path.)
  await typeOtp(page, STATIC_OTP);
  await verify.click();
  const seen = await textSeen(page, 3000);
  await expect(page.getByText('Log out'), `login after resend did not succeed (page said: ${seen.slice(0, 150)})`).toBeVisible({ timeout: 15000 });
});
