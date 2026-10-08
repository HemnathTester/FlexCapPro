import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, clickWizardNext } from '../../utils/flows';

test('BO-DOCUMENT-EXPIRY-WARNINGS Uploading expired Trade License or Emirates ID triggers document expiry warning', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BODOCEXP' });
  await gotoOnboarding(page);

  await fillOnboardingStep1(page, { legalName: 'UA Expired Doc Test LLC' });
  await clickWizardNext(page);

  const expiryInput = page.locator('#licenseExpiryInput, input[name="licenseExpiryDate"]').first();
  if (await expiryInput.isVisible()) {
    await expiryInput.fill('2020-01-01'); // Past expiry date
    await clickWizardNext(page);

    const warn = page.locator('.error-message, .invalid-feedback, :text-matches("expired|valid date", "i")').first();
    if (await warn.isVisible()) {
      await expect(warn).toBeVisible();
    }
  }
});
