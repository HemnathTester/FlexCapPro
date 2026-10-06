import { test, expect } from '../../fixtures/base';
import { scratchAccount, submitLogin, otpBoxes, otpVerifyButton, otpFrom, typeOtp, getMail, inboxOf, textSeen, snap } from '../../utils/flows';
import { yopmail } from '../../utils/yopmail';

test('UA-LOGIN-OTP-INPUT-AND-RESEND-RULES OTP input rules: verify blocked until complete, non-numeric rejected, paste fills all boxes, resend disabled during countdown, old OTP invalid after resend', async ({ page, browser }) => {
  test.setTimeout(6 * 60 * 1000);
  const acc = await scratchAccount(page, browser);
  const inbox = inboxOf(acc.email);
  const known = await snap(browser, inbox);
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
  const first = await getMail(browser, inbox, known, /login code/i, 'the login code mail');
  const oldCode = otpFrom(first.text);
  const known2 = new Set([...known, first.id]);
  await expect(page.getByText(/Resend OTP in\s*\d{2}:\d{2}/)).toBeHidden({ timeout: 90000 });
  const resend = page.getByText(/^\s*Resend OTP\s*$/);
  await expect(resend, 'Resend OTP link must be available after the countdown').toBeVisible();
  await resend.click();

  // 5. A new OTP arrives and the old one no longer works.
  const second = await getMail(browser, inbox, known2, /login code/i, 'the second login code mail');
  const newCode = otpFrom(second.text);
  expect(newCode, 'resend must issue a different OTP').not.toBe(oldCode);
  await typeOtp(page, oldCode);
  await verify.click();
  const seen = await textSeen(page, 2500);
  expect(await page.getByText('Log out').isVisible(), `the OLD OTP was accepted after resend (page said: ${seen.slice(0, 150)})`).toBe(false);
});
