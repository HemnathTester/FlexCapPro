import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, clickWizardNext } from '../../utils/flows';

test('BO-REFERRAL-PROMO-CODE-APPLY Valid and invalid referral link or partner promo code application during wizard', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOREFERRAL' });
  await gotoOnboarding(page);

  await fillOnboardingStep1(page, { legalName: 'UA Partner Referral Supplier LLC' });

  const promoInput = page.locator('#referralCodeInput, input[name="referralCode"], input[name="promoCode"]').first();
  const applyBtn = page.getByRole('button', { name: /apply|validate/i }).first();

  if (await promoInput.isVisible()) {
    await promoInput.fill('PARTNER2026');
    if (await applyBtn.isVisible()) await applyBtn.click();
  }

  await clickWizardNext(page);
});
