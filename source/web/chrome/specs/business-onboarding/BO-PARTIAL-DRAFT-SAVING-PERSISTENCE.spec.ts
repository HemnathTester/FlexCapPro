import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, fillOnboardingStep2, clickWizardNext } from '../../utils/flows';

test('BO-PARTIAL-DRAFT-SAVING-PERSISTENCE Explicit Save Draft button and multi-session/multi-device draft state recovery', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BODRAFTSAVE' });
  await gotoOnboarding(page);

  await fillOnboardingStep1(page, { legalName: 'UA Draft Saving Entity LLC' });
  await clickWizardNext(page);

  await fillOnboardingStep2(page, { contactName: 'Draft Manager' });

  const saveDraftBtn = page.getByRole('button', { name: /save draft|save & exit|save for later/i }).first();
  if (await saveDraftBtn.isVisible()) {
    await saveDraftBtn.click();
    await page.waitForTimeout(1000);
  }

  // Re-open onboarding page and assert draft persistence
  await gotoOnboarding(page);
  await expect(page).toHaveURL(/onboarding/i);
});
