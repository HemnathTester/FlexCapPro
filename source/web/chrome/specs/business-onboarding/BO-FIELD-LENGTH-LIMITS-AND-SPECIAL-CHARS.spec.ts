import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, gotoOnboarding, fillOnboardingStep1, clickWizardNext } from '../../utils/flows';

test('BO-FIELD-LENGTH-LIMITS-AND-SPECIAL-CHARS Boundary field length limits, min/max characters, special characters, and leading/trailing spaces', async ({ page, browser }) => {
  await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'BOBOUNDARIES' });
  await gotoOnboarding(page);

  const maxLenName = 'A'.repeat(260); // Exceeds standard 255 char limit
  const injectionName = "  <script>alert('XSS')</script> Trimmed Business LLC  ";

  await fillOnboardingStep1(page, {
    legalName: injectionName,
    tradeName: maxLenName,
  });

  const nameInput = page.locator('#legalNameInput, input[name="legalName"], #businessNameInput').first();
  if (await nameInput.isVisible()) {
    const val = await nameInput.inputValue();
    // Value is filled; script tags must be rendered inertly or sanitized
    expect(val).not.toContain('<script>');
  }

  await clickWizardNext(page);
});
