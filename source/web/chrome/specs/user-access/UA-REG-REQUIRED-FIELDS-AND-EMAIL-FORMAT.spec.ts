import { test, expect } from '../../fixtures/base';
import { fillRegister, submitRegister, textSeen, verificationPopup, uniqueInbox } from '../../utils/flows';

test('UA-REG-REQUIRED-FIELDS-AND-EMAIL-FORMAT Required-field validation: empty mandatory fields and invalid email formats are rejected with inline errors', async ({ page }) => {
  // Empty form: every mandatory field reports it is required and nothing is sent to the server.
  await page.goto('/signup');
  let sent = false;
  page.on('request', (r) => {
    if (/\/auth\/users$/.test(r.url()) && r.method() === 'POST') sent = true;
  });
  await page.getByRole('button', { name: 'Sign Up' }).click();
  for (const msg of ['Business Name is required.', 'Mobile Number is required.', 'Email is required.', 'Password is required.', 'Confirm Password is required.']) {
    await expect(page.getByText(msg, { exact: true })).toBeVisible();
  }
  expect(sent, 'an empty form must not call the registration API').toBe(false);

  // Invalid email formats: rejected, an email error is visible, no account is created, no pop-up.
  const bad = ['plainaddress', 'missing-at.yopmail.com', 'two@@yopmail.com', 'spaces in@yopmail.com', '@yopmail.com', 'user@', 'user@yopmail'];
  const failures: string[] = [];
  for (const email of bad) {
    sent = false;
    await fillRegister(page, { email });
    await submitRegister(page).catch(() => null);
    const seen = await textSeen(page, 1200);
    const popup = await verificationPopup(page).isVisible();
    if (sent || popup) failures.push(`"${email}" was accepted (request sent: ${sent}, pop-up: ${popup})`);
    else if (!/valid|invalid|email/i.test(seen.replace(/Your Organisation Email/i, ''))) failures.push(`"${email}" rejected without any visible email error`);
  }
  expect(failures, failures.join('; ')).toEqual([]);
  void uniqueInbox;
});
