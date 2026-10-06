import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, loginFull } from '../../utils/flows';

test('UA-LOGIN-NEW-USER-GOES-TO-ONBOARDING Newly verified user who has not onboarded is routed to Onboarding after login', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'NEWUSER' });
  await loginFull(page, browser, acc.email, acc.password);
  await expect(page).toHaveURL(/onBoarding/i);
  await expect(page.getByText(/onboarding/i).first()).toBeVisible();
  await expect(page.getByText('Business Details')).toBeVisible();
});
