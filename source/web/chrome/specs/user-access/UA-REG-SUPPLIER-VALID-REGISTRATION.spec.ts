import { test } from '../../fixtures/base';
import { registerAndVerifyRole } from '../../utils/flows';

test('UA-REG-SUPPLIER-VALID-REGISTRATION Register a Supplier with all valid mandatory fields; verification pop-up shows and verification email arrives', async ({ page, browser }) => {
  await registerAndVerifyRole(page, browser, 'Supplier', 'SUPPLIERREG');
});
