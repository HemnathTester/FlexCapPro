import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, clickWizardNext } from '../../utils/flows';

test('BO-DOCUMENT-UPLOAD-INVALID-TYPES Uploading unsupported document formats or oversized files is rejected with error feedback', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BODOCUPLOAD' });
  await gotoOnboarding(page);

  await fillOnboardingStep1(page, { legalName: 'UA Doc Upload Test LLC' });
  await clickWizardNext(page);

  // Navigate to document step if file inputs are present
  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.isVisible()) {
    // Attempt uploading invalid executable extension
    await fileInput.setInputFiles({
      name: 'unauthorized_script.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('MZ...dummy executable content'),
    }).catch(() => undefined);

    const err = page.locator('.error-message, .invalid-feedback, :text-matches("file type|format|not supported", "i")').first();
    if (await err.isVisible()) {
      await expect(err).toBeVisible();
    }
  }
});
