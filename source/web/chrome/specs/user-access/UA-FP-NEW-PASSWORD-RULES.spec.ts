import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, startForgotPassword, forgotOtp, inboxOf, snap, submitForgotOtp, reachedChangePassword, setNewPassword } from '../../utils/flows';

test('UA-FP-NEW-PASSWORD-RULES New password policy violations and confirm-mismatch are rejected on the change-password step', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'NEWPWRULES' });
  const known = await snap(browser, inboxOf(acc.email), 'otp');
  await startForgotPassword(page, acc.email);
  await submitForgotOtp(page, await forgotOtp(browser, inboxOf(acc.email), known));
  expect(await reachedChangePassword(page), 'a correct OTP must lead to the change-password step').toBe(true);

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
    const r = await setNewPassword(page, pw, confirm);
    if (r.accepted) failures.push(`${name}: ACCEPTED`);
    else if (!/password|match|character|digit|upper|lower|special|length|least|valid/i.test(r.seen.replace(/Enter your password|Confirm your password|New password/gi, ''))) failures.push(`${name}: rejected without a visible message`);
  }
  expect(failures, failures.join(' || ')).toEqual([]);
});
