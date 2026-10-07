import { test, expect } from '../../fixtures/base';

// Scope today: unauthenticated access. Wrong-role and "Dashboard before onboarding" checks need the Dashboard route
// names and an onboarded account, which do not exist yet (see User-Access-Plan.md).
test('UA-LOGIN-ROUTE-GUARD-SIGNED-OUT Route guard: protected pages redirect to Login when not signed in', async ({ page }) => {
  for (const route of ['/airlines/onBoarding', '/airlines/onboarding', '/airlines/dashboard']) {
    await page.goto(route);
    await page.waitForTimeout(1500);
    const url = page.url();
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    const showsProtected = /welcome to amplifi|business details|log out/.test(bodyText);
    expect(showsProtected, `${route} showed protected content to a signed-out visitor (landed on ${url})`).toBe(false);
    expect(url, `${route} should redirect a signed-out visitor to Login`).toMatch(/\/login/);
  }
});
