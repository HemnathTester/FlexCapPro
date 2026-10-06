import { test, expect } from '../../fixtures/base';
import { scratchAccount, loginFull } from '../../utils/flows';

test('UA-LOGIN-LOGOUT-ENDS-SESSION Logout ends the session; browser Back does not restore access', async ({ page, browser }) => {
  const acc = await scratchAccount(page, browser);
  await loginFull(page, browser, acc.email, acc.password);
  await expect(page.getByText('Log out')).toBeVisible();

  await page.getByText('Log out').click();
  await expect(page).toHaveURL(/\/login/);

  await page.goBack();
  await page.waitForTimeout(1500);
  expect(await page.getByText('Log out').isVisible(), 'Back after logout showed the signed-in page').toBe(false);

  await page.goto('/airlines/onBoarding');
  await expect(page).toHaveURL(/\/login/);
});
