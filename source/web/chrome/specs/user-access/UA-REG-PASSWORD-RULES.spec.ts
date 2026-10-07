import { test, expect } from '../../fixtures/base';
import { fillRegister, submitRegister, textSeen, verificationPopup, uniqueInbox } from '../../utils/flows';

test('UA-REG-PASSWORD-RULES Password policy violations and Password/Confirm mismatch are rejected', async ({ page }) => {
  const failures: string[] = [];
  const check = async (name: string, password: string, confirm?: string) => {
    await fillRegister(page, { email: `${uniqueInbox('PWRULES')}@yopmail.com`, password, confirm });
    const res = await submitRegister(page);
    const seen = await textSeen(page, 1500);
    const accepted = res?.status === 200 || (await verificationPopup(page).isVisible());
    if (accepted) failures.push(`${name}: ACCEPTED`);
    else if (!/password|match|character|digit|upper|lower|special|length|least/i.test(seen.replace(/Enter your password|Confirm your password/gi, ''))) {
      failures.push(`${name}: rejected without a visible password message`);
    }
  };
  await check('too short (Ab1!)', 'Ab1!');
  await check('no upper-case (test@1234)', 'test@1234');
  await check('no lower-case (TEST@1234)', 'TEST@1234');
  await check('no digit (Test@abcd)', 'Test@abcd');
  await check('no special character (Test12345)', 'Test12345');
  await check('Confirm differs from Password', 'Test@1234', 'Test@12345');
  expect(failures, failures.join(' || ')).toEqual([]);
});
