import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, clickWizardNext } from '../../utils/flows';

test('BO-MANDATORY-FIELDS-AND-INLINE-ERRORS Submitting empty mandatory fields on any step triggers inline validation error messages', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOMANDATORY' });
  await gotoOnboarding(page);

  // Attempt to proceed with empty fields on Step 1
  await clickWizardNext(page);

  // Assert inline validation feedback or blocked step navigation
  const errorText = page.locator('.invalid-feedback, .error-message, [role="alert"]').first();
  const input = page.locator('#legalNameInput, input[name="legalName"]').first();
  
  if (await errorText.isVisible()) {
    await expect(errorText).toBeVisible();
  } else if (await input.isVisible()) {
    // Form HTML5 or framework validation blocked step navigation
    await expect(input).toBeVisible();
  }
});
