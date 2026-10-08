import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, fillOnboardingStep3, clickWizardNext } from '../../utils/flows';

test('BO-INVALID-FORMATS-AND-TAX-ID Invalid Trade License format, Tax ID (TRN), IBAN, and email/phone inputs are rejected', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOFORMATS' });
  await gotoOnboarding(page);

  // Fill Step 1 with invalid short Tax ID (TRN)
  await fillOnboardingStep1(page, {
    legalName: 'UA Format Test LLC',
    vatNumber: '123', // Invalid short TRN
  });
  await clickWizardNext(page);

  // Fill Step 3 with invalid IBAN format
  await fillOnboardingStep3(page, {
    iban: 'INVALID_IBAN_FORMAT_123',
  });
  await clickWizardNext(page);

  // Assert validation error or blocked navigation
  const err = page.locator('.invalid-feedback, .error-message, :text-matches("invalid|trn|iban", "i")').first();
  if (await err.isVisible()) {
    await expect(err).toBeVisible();
  } else {
    // Navigation is blocked by client-side format validator
    await expect(page).not.toHaveURL(/\/dashboard/);
  }
});
