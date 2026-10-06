import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, startForgotPassword, getMail, inboxOf, snap, resetLinkOf, setNewPassword } from '../../utils/flows';

test('UA-FP-NEW-PASSWORD-RULES New password policy violations and confirm-mismatch are rejected', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'NEWPWRULES' });
  const known = await snap(browser, inboxOf(acc.email));
  await startForgotPassword(page, acc.email);
  const mail = await getMail(browser, inboxOf(acc.email), known, /reset|password/i, 'the password reset email (link)');
  const link = resetLinkOf(mail.links);

  const failures: string[] = [];
  const cases: [string, string, string?][] = [
    ['too short (Ab1!)', 'Ab1!'],
    ['no upper-case (test@1234)', 'test@1234'],
    ['no lower-case (TEST@1234)', 'TEST@1234'],
    ['no digit (Test@abcd)', 'Test@abcd'],
    ['no special character (Test12345)', 'Test12345'],
    ['confirm differs', 'Valid@12345', 'Other@12345'],
  ];
  for (const [name, pw, confirm] of cases) {
    await page.goto(link);
    const r = await setNewPassword(page, pw, confirm);
    if (r.accepted) failures.push(`${name}: ACCEPTED`);
    else if (!/password|match|character|digit|upper|lower|special|length|least|valid/i.test(r.seen.replace(/Enter your password|Confirm your password|New password/gi, ''))) failures.push(`${name}: rejected without a visible message`);
  }
  expect(failures, failures.join(' || ')).toEqual([]);
});
