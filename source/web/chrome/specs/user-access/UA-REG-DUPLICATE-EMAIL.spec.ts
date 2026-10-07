import { test, expect } from '../../fixtures/base';
import { fillRegister, submitRegister, textSeen, verificationPopup, createVerifiedAccount } from '../../utils/flows';

test('UA-REG-DUPLICATE-EMAIL Duplicate email rejected, including case and leading/trailing-space variants and the other role option', async ({ page, browser }) => {
  // A fresh, verified account to collide with (never touches the main accounts).
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'DUPEMAIL' });

  const variants: { name: string; email: string; role: 'Supplier' | 'Buyer' }[] = [
    { name: 'same email, same role', email: acc.email, role: 'Supplier' },
    { name: 'upper-case email', email: acc.email.toUpperCase(), role: 'Supplier' },
    { name: 'leading/trailing spaces', email: `  ${acc.email}  `, role: 'Supplier' },
    { name: 'same email under the other role', email: acc.email, role: 'Buyer' },
  ];
  const failures: string[] = [];
  for (const v of variants) {
    await fillRegister(page, { role: v.role, email: v.email });
    const res = await submitRegister(page);
    const seen = await textSeen(page, 2500);
    const accepted = res?.status === 200 || (await verificationPopup(page).isVisible());
    if (accepted) failures.push(`${v.name}: duplicate was ACCEPTED`);
    else if (!/exist|already|registered|duplicate|taken|in use/i.test(seen)) failures.push(`${v.name}: rejected (API ${res?.status ?? 'none'}: ${res?.body?.message ?? '-'}) but the user saw NO message explaining why`);
  }
  expect(failures, failures.join(' || ')).toEqual([]);
});
