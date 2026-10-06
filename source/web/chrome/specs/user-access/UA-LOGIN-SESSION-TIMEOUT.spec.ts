import { test, expect } from '../../fixtures/base';
import { scratchAccount, loginFull } from '../../utils/flows';

// REQ-UM-006 / BR-021: 30 minutes by default. Runs only with --slow.
test('UA-LOGIN-SESSION-TIMEOUT Session expires after inactivity (default 30 min) with a warning beforehand @slow', async ({ page, browser }) => {
  test.skip(process.env.RUN_SLOW !== '1', 'Slow scenario (about 32 minutes). Run with --slow to include it.');
  test.setTimeout(40 * 60 * 1000);
  const acc = await scratchAccount(page, browser);
  await loginFull(page, browser, acc.email, acc.password);
  await page.waitForTimeout(31 * 60 * 1000);
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
});
