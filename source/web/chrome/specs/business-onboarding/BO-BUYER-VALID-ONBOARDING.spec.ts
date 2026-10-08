import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, fillOnboardingStep2, fillOnboardingStep3, clickWizardNext, submitOnboarding, dummyTradeLicense, dummyTRN, dummyIBAN } from '../../utils/flows';

test('BO-BUYER-VALID-ONBOARDING Complete valid Buyer business onboarding wizard across all steps and submit application', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Buyer', label: 'BOBUYER' });
  await gotoOnboarding(page);

  // Step 1: Buyer Business Profile
  await fillOnboardingStep1(page, {
    legalName: 'UA Buyer Global Corp LLC',
    tradeName: 'UA Buyer Global',
    tradeLicense: dummyTradeLicense(),
    vatNumber: dummyTRN(),
  });
  await clickWizardNext(page);

  // Step 2: Key Finance Contacts
  await fillOnboardingStep2(page, {
    contactName: 'Robert Vance',
    contactEmail: 'finance@uabuyer.com',
  });
  await clickWizardNext(page);

  // Step 3: Payment & Settlement Details
  await fillOnboardingStep3(page, {
    accountNumber: '11223344556',
    iban: dummyIBAN(),
    swiftCode: 'FABEAEADXXX',
  });
  await clickWizardNext(page);

  // Step 4: Final Submission
  const calls = await submitOnboarding(page);
  await expect(page.getByText(/submitted|under review|pending|success/i).first()).toBeVisible({ timeout: 15000 });
});
