import { test, expect } from '../../fixtures/base';
import { fillRegister, uniqueInbox, inboxOf, snap, autoMail, askMailbox } from '../../utils/flows';
import { yopmail } from '../../utils/yopmail';

test('UA-REG-DOUBLE-CLICK-SIGNUP Double-click on Sign Up creates exactly one account and one verification email', async ({ page, browser }) => {
  const email = `${uniqueInbox('DBLCLICK')}@yopmail.com`;
  const inbox = inboxOf(email);
  const known = await snap(browser, inbox);
  const statuses: number[] = [];
  page.on('response', (r) => {
    if (/\/auth\/users$/.test(r.url()) && r.request().method() === 'POST') statuses.push(r.status());
  });
  await fillRegister(page, { email });
  await page.getByRole('button', { name: 'Sign Up' }).dblclick();
  await page.waitForTimeout(5000);
  expect(statuses.filter((s) => s === 200), `registration calls and statuses: ${statuses.join(',')}`).toHaveLength(1);

  // Exactly one verification mail.
  if (autoMail()) {
    const first = await yopmail.waitForNew(browser, inbox, { subject: /verify your email/i, known, timeoutMs: 75000 });
    const second = await yopmail.expectNoNew(browser, inbox, { subject: /verify your email/i, known: new Set([...known, first.id]), windowMs: 20000 });
    expect(second, 'a second verification email arrived').toBe(true);
  } else {
    const answer = await askMailbox(inbox, 'Wait about 30 seconds, then type how many "Verify Your Email" emails are in the inbox (a number; expected 1):');
    expect(Number(answer.match(/\d+/)?.[0]), 'number of verification emails received').toBe(1);
  }
});
