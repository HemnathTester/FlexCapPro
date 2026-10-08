import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, fillOnboardingStep2, fillOnboardingStep3, clickWizardNext, dummyIBAN } from '../../utils/flows';

test('BO-SETTLEMENT-PENNY-DROP-VERIFICATION Penny-drop / penny-deposit bank account verification for settlement account', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOPENNYDROP' });
  await gotoOnboarding(page);

  await fillOnboardingStep1(page, { legalName: 'UA Penny Drop Verification LLC' });
  await clickWizardNext(page);

  await fillOnboardingStep2(page, { contactName: 'Finance Manager' });
  await clickWizardNext(page);

  await fillOnboardingStep3(page, { iban: dummyIBAN() });

  const verifyBankBtn = page.getByRole('button', { name: /verify account|penny drop|verify bank/i }).first();
  if (await verifyBankBtn.isVisible()) {
    await verifyBankBtn.click();
    await page.waitForTimeout(1000);
  }

  await clickWizardNext(page);
});
