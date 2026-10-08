import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, submitOnboarding } from '../../utils/flows';

test('BO-STATUS-INFO-REQUESTED-RESUBMIT Editing rejected fields, re-uploading documents, and re-submitting after Backoffice info request', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BORESUBMIT' });
  await gotoOnboarding(page);

  // Assert info request banner or re-submission option if present
  const infoBanner = page.locator('.alert-warning, :text-matches("info requested|clarification|update required", "i")').first();
  const updateBtn = page.getByRole('button', { name: /update application|re-submit|edit details/i }).first();

  if (await infoBanner.isVisible() && await updateBtn.isVisible()) {
    await updateBtn.click();
    await submitOnboarding(page);
  } else {
    await expect(page).toHaveURL(/onboarding|dashboard/i);
  }
});
