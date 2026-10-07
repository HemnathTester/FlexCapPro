import { test, expect } from '../../fixtures/base';
import { scratchAccount, startForgotPassword, textSeen } from '../../utils/flows';

test('UA-FP-UNKNOWN-AND-INVALID-EMAIL Unknown, empty and invalid email handled safely (no account enumeration)', async ({ page, browser }) => {
  const acc = await scratchAccount(page, browser);

  // A known and an unknown address must get the same answer, otherwise registered emails can be discovered.
  const known = await startForgotPassword(page, acc.email);
  const knownText = await textSeen(page, 1000);
  const unknown = await startForgotPassword(page, `nobody.${Date.now().toString(36)}@yopmail.com`);
  const unknownText = await textSeen(page, 1000);
  const sig = (calls: { status: number; message: string }[]) => calls.map((c) => `${c.status}:${c.message}`).join('|');
  expect(sig(unknown), 'unknown email must not reveal that the account does not exist (response differs from a known email)').toBe(sig(known));
  expect(unknownText.includes('not registered') || unknownText.includes('not found') || unknownText.includes('does not exist'), `page said: ${unknownText.slice(0, 200)}`).toBe(false);
  void knownText;

  // Empty and badly formatted emails: nothing is submitted.
  for (const bad of ['', 'plainaddress', 'a@b', 'two@@yopmail.com']) {
    await page.goto('/login');
    await page.getByText('Forgot Password?').click();
    await page.locator('#registeredEmail').fill(bad);
    let sent = false;
    const watch = (r: import('@playwright/test').Request) => {
      if (r.method() !== 'GET' && /flexcappro/.test(r.url())) sent = true;
    };
    page.on('request', watch);
    await page.locator('button[type=submit]', { hasText: 'Submit' }).click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(1500);
    page.off('request', watch);
    expect(sent, `"${bad}" was submitted to the server`).toBe(false);
  }
});
