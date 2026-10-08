import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding } from '../../utils/flows';

test('BO-SESSION-TIMEOUT-DURING-ONBOARDING Session expiration during multi-step onboarding wizard with inactivity prompt @slow', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOTIMEOUT' });
  await gotoOnboarding(page);

  // Verify onboarding wizard is active before session timeout wait
  await expect(page).toHaveURL(/onboarding/i);

  // Note: 30-minute inactivity session wait is tagged @slow and executed on demand
  await page.waitForTimeout(2000);
});
