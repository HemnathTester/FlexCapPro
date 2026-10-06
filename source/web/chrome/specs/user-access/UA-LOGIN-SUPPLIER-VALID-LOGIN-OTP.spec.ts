import { test, expect } from '../../fixtures/base';
import { ensureMainAccount, loginFull } from '../../utils/flows';

// Note: a newly registered account has not completed onboarding, so UAT lands it on Onboarding, not the Dashboard.
// An onboarded account would land on the Dashboard; no onboarded account exists yet (see User-Access-Plan.md).
test('UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP Verified Supplier logs in with email + password + correct OTP and lands inside the application', async ({ page, browser }) => {
  const acc = await ensureMainAccount(page, browser, 'Supplier');
  await loginFull(page, browser, acc.email, acc.password);
  await expect(page).toHaveURL(/onBoarding|dashboard/i);
  await expect(page.getByText('Log out')).toBeVisible();
});
