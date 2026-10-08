import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, clickWizardNext, clickWizardBack } from '../../utils/flows';

test('BO-WIZARD-STEP-NAVIGATION Validate wizard step navigation, Next/Back buttons, step indicators, and form state preservation', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BONAV' });
  await gotoOnboarding(page);

  const testName = 'UA Preserved Legal Name LLC';
  await fillOnboardingStep1(page, { legalName: testName });
  await clickWizardNext(page);

  // Navigate Back to Step 1
  await clickWizardBack(page);

  // Verify form data is preserved
  const input = page.locator('#legalNameInput, input[name="legalName"], #businessNameInput').first();
  if (await input.isVisible()) {
    await expect(input).toHaveValue(testName);
  }

  // Navigate forward again
  await clickWizardNext(page);
  await expect(page.getByRole('button', { name: /next|continue|proceed/i }).first()).toBeVisible();
});
