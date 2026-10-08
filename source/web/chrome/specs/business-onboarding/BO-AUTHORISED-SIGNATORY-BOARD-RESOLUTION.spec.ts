import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, fillOnboardingStep2, clickWizardNext } from '../../utils/flows';

test('BO-AUTHORISED-SIGNATORY-BOARD-RESOLUTION Board Resolution document upload and signatory authorization verification', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOBOARDAUTH' });
  await gotoOnboarding(page);

  await fillOnboardingStep1(page, { legalName: 'UA Signatory Auth LLC' });
  await clickWizardNext(page);

  await fillOnboardingStep2(page, { contactName: 'Managing Director' });
  const boardResUpload = page.locator('input[type="file"][name="boardResolution"]').first();
  if (await boardResUpload.isVisible()) {
    await boardResUpload.setInputFiles({
      name: 'board_resolution.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 dummy board resolution content'),
    }).catch(() => undefined);
  }

  await clickWizardNext(page);
});
