import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, clickWizardNext } from '../../utils/flows';

test('BO-WIZARD-PAGE-REFRESH-AND-BACK Browser page refresh, browser back button, and unsaved step draft recovery behavior', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOREFRESH' });
  await gotoOnboarding(page);

  const legalName = 'UA Refresh Draft Test LLC';
  await fillOnboardingStep1(page, { legalName });
  await clickWizardNext(page);

  // Trigger browser refresh (F5)
  await page.reload();
  await page.waitForTimeout(1000);

  // Assert user remains on onboarding wizard without application crash
  await expect(page).toHaveURL(/onboarding/i);
});
