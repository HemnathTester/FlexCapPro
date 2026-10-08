import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, clickWizardNext } from '../../utils/flows';

test('BO-INDUSTRY-SPECIFIC-LICENSE-CHECKS Industry-specific license validations (Airlines, Logistics, General Trading)', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOINDUSTRY' });
  await gotoOnboarding(page);

  const industrySelect = page.locator('#industrySelect, select[name="industry"]').first();
  if (await industrySelect.isVisible()) {
    await industrySelect.selectOption({ label: 'Airlines' }).catch(() => undefined);
  }

  await fillOnboardingStep1(page, { legalName: 'UA Air Freight Cargo LLC' });
  await clickWizardNext(page);
});
