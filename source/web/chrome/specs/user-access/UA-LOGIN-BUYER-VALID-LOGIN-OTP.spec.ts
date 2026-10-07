import { test, expect } from '../../fixtures/base';
import { ensureMainAccount, loginFull } from '../../utils/flows';

test('UA-LOGIN-BUYER-VALID-LOGIN-OTP Verified Buyer logs in with email + password + correct OTP and lands inside the application', async ({ page, browser }) => {
  const acc = await ensureMainAccount(page, browser, 'Buyer');
  await loginFull(page, browser, acc.email, acc.password);
  await expect(page).toHaveURL(/onBoarding|dashboard/i);
  await expect(page.getByText('Log out')).toBeVisible();
});
