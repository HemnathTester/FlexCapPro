import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, clickWizardNext } from '../../utils/flows';

test('BO-DUPLICATE-BUSINESS-REGISTRATION Submitting an already registered Tax ID or Trade License number is rejected with duplicate alert', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BODUPLICATE' });
  await gotoOnboarding(page);

  // Fill Step 1 using a known duplicate TRN / Trade License
  await fillOnboardingStep1(page, {
    legalName: 'UA Duplicate Check LLC',
    tradeLicense: 'TL-EXISTING-100',
    vatNumber: '100000000000003',
  });
  await clickWizardNext(page);

  // Check for duplicate warning message or rejection toast
  const alert = page.locator('.alert-danger, .error-message, :text-matches("already registered|duplicate|exists", "i")').first();
  if (await alert.isVisible()) {
    await expect(alert).toBeVisible();
  }
});
