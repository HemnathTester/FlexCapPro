import { test, expect } from '../../fixtures/base';
import { scratchAccount, submitLogin, otpBoxes, textSeen } from '../../utils/flows';

test('UA-LOGIN-WRONG-PASSWORD-UNKNOWN-EMAIL-EMPTY Wrong password, unknown email and empty fields are rejected with the same generic message (no account enumeration)', async ({ page, browser }) => {
  const acc = await scratchAccount(page, browser);
  const loginCall = () => page.waitForResponse((r) => /\/auth\/users\/login$/.test(r.url()) && r.request().method() === 'POST', { timeout: 15000 });

  const run = async (email: string, password: string) => {
    const p = loginCall();
    await submitLogin(page, email, password);
    const r = await p;
    const body = await r.json().catch(() => ({}));
    const seen = await textSeen(page, 1500);
    await expect(otpBoxes(page).first()).not.toBeVisible();
    return { status: r.status(), message: String(body.message ?? ''), seen };
  };

  const wrongPw = await run(acc.email, 'Wrong@1234');
  const unknown = await run(`nobody.${Date.now().toString(36)}@yopmail.com`, 'Wrong@1234');

  expect(wrongPw.status, 'wrong password must be rejected').toBeGreaterThanOrEqual(400);
  expect(unknown.status, 'unknown email must be rejected').toBeGreaterThanOrEqual(400);
  expect(wrongPw.seen).toMatch(/invalid credentials/i);
  expect(unknown.seen).toMatch(/invalid credentials/i);
  expect(wrongPw.message, 'wrong-password and unknown-email responses must be identical so accounts cannot be enumerated').toBe(unknown.message);

  // Empty fields: the form asks for them and nothing is sent.
  await page.goto('/login');
  let sent = false;
  page.on('request', (r) => {
    if (/\/auth\/users\/login$/.test(r.url())) sent = true;
  });
  await page.locator('button[type=submit]', { hasText: 'Login' }).click();
  await page.waitForTimeout(1200);
  expect(sent, 'empty login form must not call the login API').toBe(false);
  await expect(page.locator('#emailInput')).toHaveClass(/invalid|ng-invalid/);
});
