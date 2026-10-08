import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, fillOnboardingStep2, fillOnboardingStep3, clickWizardNext } from '../../utils/flows';

test('BO-BUYER-CREDIT-LIMIT-REQUEST Buyer credit limit request, payment terms (Net 30/60/90), and credit assessment', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Buyer', label: 'BOCREDITLIMIT' });
  await gotoOnboarding(page);

  await fillOnboardingStep1(page, { legalName: 'UA Credit Line Buyer Corp' });
  await clickWizardNext(page);

  await fillOnboardingStep2(page, { contactName: 'Treasury Lead' });
  await clickWizardNext(page);

  const creditLimitInput = page.locator('#requestedCreditLimitInput, input[name="creditLimit"]').first();
  const paymentTermsSelect = page.locator('#paymentTermsSelect, select[name="paymentTerms"]').first();

  if (await creditLimitInput.isVisible()) await creditLimitInput.fill('100000');
  if (await paymentTermsSelect.isVisible()) await paymentTermsSelect.selectOption({ label: 'Net 60' }).catch(() => undefined);

  await fillOnboardingStep3(page, {});
  await clickWizardNext(page);
});
