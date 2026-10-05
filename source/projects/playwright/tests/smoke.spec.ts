import { test, expect } from '@playwright/test';

// Starter smoke — requires WEB_BASE_URL in the root .env. Replace with a real
// Scenario ID + assertion on a known page element once the app is documented.
test('smoke: home page loads', async ({ page }) => {
  test.skip(!process.env.WEB_BASE_URL, 'WEB_BASE_URL not set in .env');
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/.+/);
});
