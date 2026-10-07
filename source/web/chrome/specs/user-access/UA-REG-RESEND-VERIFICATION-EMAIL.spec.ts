import { test, expect } from '../../fixtures/base';
import { fillRegister, submitRegister, verificationPopup, uniqueInbox, inboxOf, snap, autoMail, askMailbox } from '../../utils/flows';
import { yopmail } from '../../utils/yopmail';

// Known defect from the manual run (TC_VERPOPUP_04): Resend did nothing. This asserts the CORRECT behaviour.
test('UA-REG-RESEND-VERIFICATION-EMAIL Resend verification email delivers a new email @known-defect', async ({ page, browser }) => {
  const email = `${uniqueInbox('RESEND')}@yopmail.com`;
  const inbox = inboxOf(email);
  const known = await snap(browser, inbox);
  await fillRegister(page, { email });
  expect((await submitRegister(page))?.status).toBe(200);
  await expect(verificationPopup(page)).toBeVisible();

  if (autoMail()) {
    const first = await yopmail.waitForNew(browser, inbox, { subject: /verify your email/i, known, timeoutMs: 75000 });
    await page.getByText('Resend', { exact: true }).click();
    const second = await yopmail.waitForNew(browser, inbox, { subject: /verify your email/i, known: new Set([...known, first.id]), timeoutMs: 60000 });
    expect(second.id).not.toBe(first.id);
  } else {
    await page.getByText('Resend', { exact: true }).click();
    const answer = await askMailbox(inbox, 'Wait about 30 seconds, then type how many "Verify Your Email" emails are in the inbox (expected 2 = the original + the resent one):');
    expect(Number(answer.match(/\d+/)?.[0]), 'number of verification emails after pressing Resend').toBeGreaterThanOrEqual(2);
  }
});
