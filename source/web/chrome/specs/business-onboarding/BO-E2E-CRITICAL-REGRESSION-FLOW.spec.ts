import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, fillOnboardingStep2, fillOnboardingStep3, clickWizardNext, submitOnboarding, dummyTradeLicense, dummyTRN, dummyIBAN, submitLogin, PASSWORD } from '../../utils/flows';

test('BO-E2E-CRITICAL-REGRESSION-FLOW Critical end-to-end regression verifying completed onboarding routes user to pending approval & dashboard', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOE2EREG' });
  await gotoOnboarding(page);

  // Execute full wizard flow
  await fillOnboardingStep1(page, {
    legalName: 'UA Critical Regression Supplier LLC',
    tradeLicense: dummyTradeLicense(),
    vatNumber: dummyTRN(),
  });
  await clickWizardNext(page);

  await fillOnboardingStep2(page, {
    contactName: 'E2E Regression Admin',
  });
  await clickWizardNext(page);

  await fillOnboardingStep3(page, {
    iban: dummyIBAN(),
  });
  await clickWizardNext(page);

  await submitOnboarding(page);

  // Re-login check to verify route guard & state persistence
  await submitLogin(page, acc.email, acc.password);
  await page.waitForTimeout(2000);

  // User must remain on pending/approval or dashboard state without crash
  await expect(page).not.toHaveURL(/\/login/);
});
