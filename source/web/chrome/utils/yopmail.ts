import { chromium, type Browser } from '@playwright/test';

// The mail reader always uses its OWN headless browser, whatever mode the test runs in. Reusing the test's browser made yopmail return
// empty inboxes when the tests were run with --headed/--slowmo.
let sharedMailBrowser: Browser | undefined;
async function mailBrowser(): Promise<Browser> {
  if (sharedMailBrowser && sharedMailBrowser.isConnected()) return sharedMailBrowser;
  sharedMailBrowser = await chromium.launch({ channel: 'chrome', headless: true });
  return sharedMailBrowser;
}

// Reads mail from public yopmail inboxes. Inboxes are shared with strangers, so we only ever act on mail
// that is NEW since a snapshot taken before the action under test, and that matches the expected subject.

export type Mail = { id: string; subject: string; sender: string; text: string; links: string[] };

const BLOCK = /googlesyndication|doubleclick|adtrafficquality|googleadservices|pagead|adsbygoogle|google-analytics|googletagmanager/;

async function withInbox<T>(browser: Browser, inbox: string, fn: (page: import('@playwright/test').Page) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ctx = await (await mailBrowser()).newContext({ viewport: { width: 1200, height: 800 } });
    try {
      const page = await ctx.newPage();
      await page.route('**/*', (r) => {
        const req = r.request();
        if (['image', 'media', 'font'].includes(req.resourceType()) || BLOCK.test(req.url())) return r.abort();
        return r.continue();
      });
      await page.goto(`https://yopmail.com/en/wm`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const login = page.locator('#login');
      // The login box is revealed by the page's own script a moment after load; wait for it.
      await login.waitFor({ state: 'visible', timeout: 15000 });
      await login.fill(inbox);
      await login.press('Enter');
      await page.locator('#ifinbox').waitFor({ state: 'attached', timeout: 20000 });
      return await fn(page);
    } catch (e) {
      lastError = e; // includes "Page crashed": retry in a brand-new context
    } finally {
      await ctx.close().catch(() => undefined);
    }
  }
  throw new Error(`Could not read yopmail inbox "${inbox}" after 3 attempts: ${String(lastError).split('\n')[0]}`);
}

async function listing(page: import('@playwright/test').Page) {
  const frame = page.frameLocator('#ifinbox');
  // An empty inbox legitimately has no rows, so a timeout here just means "no mail yet".
  await frame.locator('div.m').first().waitFor({ timeout: 8000 }).catch(() => undefined);
  return frame.locator('div.m').evaluateAll((els) =>
    els.map((e) => ({
      id: e.id,
      sender: (e.querySelector('.lmf') as HTMLElement | null)?.innerText.trim() ?? '',
      subject: (e.querySelector('.lms') as HTMLElement | null)?.innerText.trim() ?? '',
    })),
  );
}

export const yopmail = {
  /** IDs of the mails already in the inbox. Take this BEFORE triggering the email under test. */
  snapshot(browser: Browser, inbox: string): Promise<Set<string>> {
    return withInbox(browser, inbox, async (page) => new Set((await listing(page)).map((m) => m.id)));
  },

  /** Wait for a NEW mail (not in `known`) whose subject matches. Polls the inbox; returns its text and links. */
  async waitForNew(browser: Browser, inbox: string, opts: { subject: RegExp; known: Set<string>; timeoutMs?: number }): Promise<Mail> {
    const deadline = Date.now() + (opts.timeoutMs ?? 90000);
    let seen: { id: string; sender: string; subject: string }[] = [];
    // One inbox session per wait (refreshing in place): opening a new browser session on every poll made yopmail
    // return empty listings after a few minutes of repeated requests.
    const found = await withInbox(browser, inbox, async (page) => {
      while (Date.now() < deadline) {
        // dispatchEvent: an ad overlay can cover the button, which makes a normal click wait out its whole timeout
        await page.locator('#refresh').dispatchEvent('click', {}, { timeout: 3000 }).catch(() => undefined);
        await page.waitForTimeout(1500);
        const items = await listing(page);
        seen = items;
        const hit = items.find((m) => !opts.known.has(m.id) && opts.subject.test(m.subject));
        if (hit) {
          await page.frameLocator('#ifinbox').locator(`div.m[id="${hit.id}"]`).click();
          const body = page.frameLocator('#ifmail');
          await body.locator('body').waitFor({ timeout: 15000 });
          await page.waitForTimeout(1000);
          const text = (await body.locator('body').innerText()).replace(/\s+/g, ' ').trim();
          const links = await body.locator('a').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
          return { id: hit.id, subject: hit.subject, sender: hit.sender, text, links } as Mail;
        }
        await page.waitForTimeout(4000);
      }
      return null;
    });
    if (found) return found;
    throw new Error(
      `No new mail matching ${opts.subject} arrived for ${inbox}@yopmail.com within ${(opts.timeoutMs ?? 90000) / 1000}s. Latest subjects: ${seen
        .slice(0, 3)
        .map((m) => m.subject)
        .join(' | ')}`,
    );
  },

  /** True if NO new mail matching the subject arrives within the window. */
  async expectNoNew(browser: Browser, inbox: string, opts: { subject: RegExp; known: Set<string>; windowMs?: number }): Promise<boolean> {
    try {
      await this.waitForNew(browser, inbox, { ...opts, timeoutMs: opts.windowMs ?? 30000 });
      return false;
    } catch {
      return true;
    }
  },
};
