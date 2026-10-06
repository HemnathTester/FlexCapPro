import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, submitLogin, otpBoxes, textSeen } from '../../utils/flows';

// BR-022: failed login attempts are limited to 5 per account before further action is required.
// Disposable account: it is locked by this scenario.
test('UA-LOGIN-LOCKOUT-AFTER-WRONG-PASSWORDS Repeated wrong passwords lock the account after the limit (5)', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'LOCKPW' });
  for (let i = 1; i <= 5; i++) {
    await submitLogin(page, acc.email, `Wrong@12${i}`);
    await page.waitForTimeout(1200);
  }
  // 6th attempt with the CORRECT password: must be refused because the account is locked.
  await submitLogin(page, acc.email, acc.password);
  const seen = await textSeen(page, 3000);
  const reachedOtp = await otpBoxes(page).first().isVisible();
  expect(reachedOtp, `account was NOT locked after 5 wrong passwords (page said: ${seen.slice(0, 200)})`).toBe(false);
});
