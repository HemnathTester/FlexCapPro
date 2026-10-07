import { test } from '../../fixtures/base';
import { registerAndVerifyRole } from '../../utils/flows';

test('UA-REG-BUYER-VALID-REGISTRATION Register a Buyer with all valid mandatory fields; verification pop-up shows and verification email arrives', async ({ page, browser }) => {
  await registerAndVerifyRole(page, browser, 'Buyer', 'BUYERREG');
});
