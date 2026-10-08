import { test, expect } from '../../fixtures/base';
import { scratchAccount, startForgotPassword } from '../../utils/flows';

// Limit is not documented. Eight rapid requests for one email must hit a throttle (HTTP 429, or a clear "too many requests /
// rate limit / try again later" message); otherwise anyone can flood a user's inbox with OTP emails.
test('UA-FP-RATE-LIMIT Rapid repeated reset requests for one email are rate-limited', async ({ page, browser }) => {
  const acc = await scratchAccount(page, browser);
  const results: string[] = [];
  let throttled = false;
  for (let i = 1; i <= 8; i++) {
    const calls = await startForgotPassword(page, acc.email);
    const text = (await page.locator('body').innerText()).toLowerCase();
    results.push(calls.map((c) => c.status).join(','));
    if (calls.some((c) => c.status === 429) || /too many (requests|attempts)|rate limit|try again (later|after)|temporarily (blocked|locked)/.test(text)) {
      throttled = true;
      break;
    }
  }
  expect(throttled, `8 rapid requests were all accepted (statuses: ${results.join(' | ')})`).toBe(true);
});
