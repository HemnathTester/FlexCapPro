import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, fillOnboardingStep2, fillOnboardingStep3, clickWizardNext, submitOnboarding, dummyTradeLicense, dummyTRN, dummyIBAN } from '../../utils/flows';

test('BO-SUPPLIER-VALID-ONBOARDING Complete valid Supplier business onboarding wizard across all steps and submit application', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOSUPPLIER' });
  await gotoOnboarding(page);

  // Step 1: Business Profile
  await fillOnboardingStep1(page, {
    legalName: 'UA Supplier Logistics LLC',
    tradeName: 'UA Freight Express',
    tradeLicense: dummyTradeLicense(),
    vatNumber: dummyTRN(),
  });
  await clickWizardNext(page);

  // Step 2: Key Contacts
  await fillOnboardingStep2(page, {
    contactName: 'Jane Smith',
    contactEmail: 'jane.smith@uasupplier.com',
  });
  await clickWizardNext(page);

  // Step 3: Bank Details
  await fillOnboardingStep3(page, {
    accountNumber: '98765432101',
    iban: dummyIBAN(),
    swiftCode: 'ENBDAEADXXX',
  });
  await clickWizardNext(page);

  // Step 4: Documents & Final Submission
  const calls = await submitOnboarding(page);
  await expect(page.getByText(/submitted|under review|pending|success/i).first()).toBeVisible({ timeout: 15000 });
});
