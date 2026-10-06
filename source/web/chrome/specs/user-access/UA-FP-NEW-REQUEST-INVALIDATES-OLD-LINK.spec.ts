import { test, expect } from '../../fixtures/base';
import { createVerifiedAccount, startForgotPassword, getMail, inboxOf, snap, resetLinkOf, setNewPassword } from '../../utils/flows';

test('UA-FP-NEW-REQUEST-INVALIDATES-OLD-LINK Requesting a new reset link invalidates the earlier one', async ({ page, browser }) => {
  const acc = await createVerifiedAccount(page, browser, { role: 'Supplier', label: 'NEWLINK' });
  const inbox = inboxOf(acc.email);

  const known1 = await snap(browser, inbox);
  await startForgotPassword(page, acc.email);
  const first = await getMail(browser, inbox, known1, /reset|password/i, 'the FIRST password reset email (link)');
  const link1 = resetLinkOf(first.links);

  const known2 = new Set([...(await snap(browser, inbox)), first.id]);
  await page.waitForTimeout(2000);
  await startForgotPassword(page, acc.email);
  const second = await getMail(browser, inbox, known2, /reset|password/i, 'the SECOND (newest) password reset email (link)');
  const link2 = resetLinkOf(second.links);
  expect(link2, 'a second request should issue a different link').not.toBe(link1);

  // The older link must no longer work.
  await page.goto(link1);
  await page.waitForTimeout(1500);
  let olderAccepted = false;
  if ((await page.locator('input[type=password]').count()) > 0) olderAccepted = (await setNewPassword(page, 'Older@12345')).accepted;
  expect(olderAccepted, 'the older reset link still worked after a newer one was requested').toBe(false);

  // The newest link works.
  await page.goto(link2);
  expect((await setNewPassword(page, 'Newest@12345')).accepted, 'the newest link should work').toBe(true);
});
