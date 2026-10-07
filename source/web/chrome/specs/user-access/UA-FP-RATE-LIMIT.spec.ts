import { test, expect } from '../../fixtures/base';
import { scratchAccount, startForgotPassword } from '../../utils/flows';

// Limit is not documented. Eight rapid requests for one email must hit some throttle (HTTP 429, or a "too many /
// wait / try again" message); otherwise anyone can flood a user's inbox.
test('UA-FP-RATE-LIMIT Rapid repeated reset requests for one email are rate-limited', async ({ page, browser }) => {
  const acc = await scratchAccount(page, browser);
  const results: string[] = [];
  let throttled = false;
  for (let i = 1; i <= 8; i++) {
    const calls = await startForgotPassword(page, acc.email);
    const text = (await page.locator('body').innerText()).toLowerCase();
    results.push(calls.map((c) => c.status).join(','));
    if (calls.some((c) => c.status === 429) || /too many|try again|wait|limit|later/.test(text.replace('forgot password', ''))) {
      throttled = true;
      break;
    }
  }
  expect(throttled, `8 rapid requests were all accepted (statuses: ${results.join(' | ')})`).toBe(true);
});
