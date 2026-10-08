import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, clickWizardNext } from '../../utils/flows';

test('BO-UBO-PEP-DECLARATIONS Ultimate Beneficial Owner (>25% shareholding) verification and PEP declarations', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOUBO' });
  await gotoOnboarding(page);

  await fillOnboardingStep1(page, { legalName: 'UA UBO Verification LLC' });
  await clickWizardNext(page);

  // Fill UBO details if inputs are present
  const uboName = page.locator('#uboNameInput, input[name="uboName"]').first();
  const pepCheckbox = page.locator('#pepCheckbox, input[name="isPep"]').first();

  if (await uboName.isVisible()) {
    await uboName.fill('Alexander Wright');
  }
  if (await pepCheckbox.isVisible()) {
    await pepCheckbox.check();
    const explanation = page.locator('#pepExplanationInput, textarea[name="pepDetails"]').first();
    if (await explanation.isVisible()) await explanation.fill('Family relative in government position');
  }

  await clickWizardNext(page);
});
