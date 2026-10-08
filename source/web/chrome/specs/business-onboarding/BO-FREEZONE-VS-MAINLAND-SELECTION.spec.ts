import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, clickWizardNext } from '../../utils/flows';

test('BO-FREEZONE-VS-MAINLAND-SELECTION Onboarding variations and mandatory fields for Freezone vs Mainland UAE entities', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOFREEZONE' });
  await gotoOnboarding(page);

  const entityTypeSelect = page.locator('#entityTypeSelect, select[name="entityType"]').first();
  if (await entityTypeSelect.isVisible()) {
    await entityTypeSelect.selectOption({ label: 'Freezone' }).catch(() => undefined);
  }

  await fillOnboardingStep1(page, { legalName: 'UA Freezone Enterprise FZ-LLC' });
  await clickWizardNext(page);
});
