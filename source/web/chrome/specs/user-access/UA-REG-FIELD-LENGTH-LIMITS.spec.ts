import { test, expect } from '../../fixtures/base';
import { fillRegister, submitRegister, textSeen, verificationPopup, uniqueInbox } from '../../utils/flows';

// Boundaries. Accepted outcomes for an invalid value: blocked in the UI (input refuses/limits it) OR rejected with a
// visible message. Failure: the value is accepted (account created) or the server errors (5xx).
test('UA-REG-FIELD-LENGTH-LIMITS Field boundaries: organisation name at/over max length; mobile number min/max digits and special characters', async ({ page }) => {
  const failures: string[] = [];
  const tryRegister = async (name: string, d: { business?: string; phone?: string }, shouldBeRejected: boolean) => {
    await fillRegister(page, { email: `${uniqueInbox('LENGTHS')}@yopmail.com`, ...d });
    const typedPhone = await page.locator('#mobileNumberInput').inputValue();
    const typedName = await page.locator('#businessNameInput').inputValue();
    if ((d.phone && typedPhone !== d.phone) || (d.business && typedName !== d.business)) return; // the field itself refused/limited the value: blocked in the UI
    const res = await submitRegister(page);
    const seen = await textSeen(page, 1200);
    const accepted = res?.status === 200 || (await verificationPopup(page).isVisible());
    if (res && res.status >= 500) failures.push(`${name}: server error ${res.status}`);
    else if (shouldBeRejected && accepted) failures.push(`${name}: ACCEPTED but should be rejected`);
    else if (shouldBeRejected && !/valid|invalid|digit|number|length|characters|exceed|maximum|minimum|required/i.test(seen.replace(/Phone Number|Mobile Number is required/gi, ''))) {
      failures.push(`${name}: rejected without a visible message`);
    }
  };

  await tryRegister('business name of 300 characters', { business: 'A'.repeat(300) }, true);
  await tryRegister('phone with letters (abcdefghi)', { phone: 'abcdefghi' }, true);
  await tryRegister('phone with special characters (50-123#4567)', { phone: '50-123#4567' }, true);
  await tryRegister('phone too short (123)', { phone: '123' }, true);
  await tryRegister('phone too long (20 digits)', { phone: '5012345678901234567890' }, true);
  expect(failures, failures.join(' || ')).toEqual([]);
});
