import { chromium, type Browser, type Page } from '@playwright/test';

// Opens the yopmail inbox for the mailbox in a VISIBLE browser window so the person can read the OTP and click the
// "Verify Email" buttons themselves. The suite only opens the window; it never reads or clicks anything in it.
// One window is reused for every prompt (it moves to the next mailbox) and is closed when the test worker ends.

let browser: Browser | undefined;
let page: Page | undefined;

const ADS = /googlesyndication|doubleclick|adtrafficquality|googleadservices|pagead|adsbygoogle|google-analytics|googletagmanager/;

export async function openMailbox(inbox: string): Promise<Page | undefined> {
  // Off by default (owner decision): yopmail's "Verify you are human" check blocks the run in an automated window.
  if (process.env.OPEN_MAIL_WINDOW !== '1') return undefined;
  try {
    if (!browser || !browser.isConnected()) {
      browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1100,900', '--window-position=700,40'] });
      page = undefined;
    }
    if (!page || page.isClosed()) {
      const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } });
      page = await ctx.newPage();
      await page.route('**/*', (r) => (ADS.test(r.request().url()) ? r.abort() : r.continue()));
    }
    // Direct link for the mailbox: works even when yopmail remembers a previous inbox (its login box is then hidden).
    await page.goto('https://yopmail.com/?' + encodeURIComponent(inbox), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('#ifinbox').waitFor({ state: 'attached', timeout: 20000 });
    await page.bringToFront();
    return page;
  } catch (e) {
    // If the window cannot be opened, the prompt still names the mailbox so it can be opened by hand.
    console.log(`Could not open the yopmail window for ${inbox}: ${String(e).split('\n')[0].slice(0, 200)}`);
    await closeMailWindow(); // start from a clean window next time
    return undefined;
  }
}

export async function closeMailWindow(): Promise<void> {
  try {
    await browser?.close();
  } catch {
    /* already closed */
  }
  browser = undefined;
  page = undefined;
}
