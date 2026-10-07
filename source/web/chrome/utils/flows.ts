import type { Browser, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { dataStore } from './dataStore';
import { yopmail } from './yopmail';
import { askUser } from './ask';

export const PASSWORD = process.env.DEFAULT_PASSWORD || 'Test@1234';
export type Role = 'Supplier' | 'Buyer';

/** Unique lowercase yopmail inbox name for a disposable account. */
export const uniqueInbox = (tag: string) => `ua.${tag.replace(/[^a-z0-9]/gi, "").slice(0, 14)}.${Date.now().toString(36)}`.toLowerCase();
/** Dummy UAE mobile number (nine digits, starts with 5). */
export const dummyPhone = () => `50${String(Date.now()).slice(-7)}`;
export const inboxOf = (email: string) => email.split('@')[0];

export type RegisterData = { role?: Role; business?: string; phone?: string; email: string; password?: string; confirm?: string };
export type ApiResult = { status: number; body: { message?: string } | null } | null;

export async function fillRegister(page: Page, d: RegisterData) {
  await page.goto('/signup');
  if (d.role === 'Buyer') await page.getByRole('button', { name: 'Buyer', exact: true }).click();
  await page.locator('#businessNameInput').fill(d.business ?? 'UA Test Trading LLC');
  await page.locator('#mobileNumberInput').fill(d.phone ?? dummyPhone());
  await page.locator('#organisationEmail').fill(d.email);
  await page.locator('#passwordInput').fill(d.password ?? PASSWORD);
  await page.locator('#confirmPasswordInput').fill(d.confirm ?? d.password ?? PASSWORD);
}

/** Click Sign Up and capture the registration API call (null if the app sent no request). */
export async function submitRegister(page: Page, opts: { double?: boolean } = {}): Promise<ApiResult> {
  const responsePromise = page
    .waitForResponse((r) => /\/auth\/users$/.test(r.url()) && r.request().method() === 'POST', { timeout: 12000 })
    .catch(() => null);
  const button = page.getByRole('button', { name: 'Sign Up' });
  if (opts.double) await button.dblclick();
  else await button.click();
  const res = await responsePromise;
  return res ? { status: res.status(), body: await res.json().catch(() => null) } : null;
}

/** All distinct text lines seen on the page over `ms` (catches short-lived toasts). */
export async function textSeen(page: Page, ms = 3000): Promise<string> {
  const seen = new Set<string>();
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const t = await page.evaluate(() => document.body.innerText).catch(() => '');
    t.split('\n').map((l) => l.trim()).filter(Boolean).forEach((l) => seen.add(l));
    await page.waitForTimeout(250);
  }
  return [...seen].join(' | ');
}

export const verifiedHeading = (page: Page) => page.getByRole('heading', { name: /has been verified/i });
export const verificationPopup = (page: Page) => page.getByText('Verification Email Sent!');

/** Register, read the verification mail, open the link and click Verify. Returns the verified account. */
export async function createVerifiedAccount(page: Page, browser: Browser, o: { role?: Role; label: string; email?: string }) {
  const email = o.email ?? `${uniqueInbox(o.label)}@yopmail.com`;
  const inbox = inboxOf(email);
  const known = await snap(browser, inbox);
  await fillRegister(page, { role: o.role, email, business: `UA ${o.label} Trading LLC` });
  const res = await submitRegister(page);
  if (res?.status !== 200) throw new Error(`Registration of ${email} failed: ${res?.status} ${res?.body?.message ?? 'no response'}`);
  await verifyFromMail(page, browser, inbox, known);
  await dataStore.add('Users', { Role: o.role ?? 'Supplier', Email: email, Password: PASSWORD, Verified: true }, o.label);
  return { email, inbox, password: PASSWORD };
}

export async function verifyFromMail(page: Page, browser: Browser, inbox: string, known: Set<string>) {
  const mail = await getMail(browser, inbox, known, /verify your email/i, `the "Verify Your Email" mail`);
  return openVerifyLink(page, mail.links, inbox);
}

export function verifyLinkOf(links: string[], inbox: string): string {
  const link = links.find((l) => /verify-email/.test(l));
  if (!link) throw new Error(`Verification mail for ${inbox} had no verify-email link`);
  return link;
}

/** Open the link from the verification mail and click the Verify button. */
export async function openVerifyLink(page: Page, links: string[], inbox: string) {
  const link = verifyLinkOf(links, inbox);
  await page.goto(link);
  await page.getByRole('button', { name: /verify your email/i }).click();
  await expect(verifiedHeading(page)).toBeVisible();
  return link;
}

/**
 * Mail handling. DEFAULT (owner decision): the suite does not read yopmail itself. It stops and asks the person running
 * the CLI for the OTP / link, naming the mailbox to open. `--auto-mail` switches the old automatic reader back on
 * (it then still falls back to asking if the mail cannot be found).
 */
export const autoMail = () => process.env.MAIL_MODE === 'auto';

/** IDs of mails already in the inbox (only meaningful in auto mode). */
export async function snap(browser: Browser, inbox: string): Promise<Set<string>> {
  return autoMail() ? yopmail.snapshot(browser, inbox) : new Set<string>();
}

export async function getMail(browser: Browser, inbox: string, known: Set<string>, subject: RegExp, what: string, timeoutMs = 75000) {
  if (autoMail()) {
    try {
      return await yopmail.waitForNew(browser, inbox, { subject, known, timeoutMs });
    } catch {
      /* fall through to asking the person */
    }
  }
  const wantsCode = /login code|otp|code/i.test(what);
  const wantsLink = /verify|reset|link/i.test(what) && !wantsCode;
  const paste = wantsCode ? 'the 6-digit code from the email' : wantsLink ? 'the link behind the button in the email (right-click the button, Copy link address)' : 'the value requested';
  const answer = await askUser(
    `Mailbox: ${inbox}@yopmail.com   (open https://yopmail.com/?${inbox})\nOpen ${what} and paste ${paste}. Type "skip" to skip this step.`,
  );
  if (/^skip$/i.test(answer)) throw new Error(`Skipped by the person running the suite: ${what} for ${inbox}@yopmail.com`);
  return { id: `manual-${Date.now()}`, subject: what, sender: 'manual', text: answer, links: [answer] };
}

/** Ask a yes/no or short question about the mailbox (used where the suite cannot see mail itself). */
export async function askMailbox(inbox: string, question: string): Promise<string> {
  return askUser(`Mailbox: ${inbox}@yopmail.com   (open https://yopmail.com/?${inbox})\n${question}`);
}

export const otpBoxes = (page: Page) => page.locator('input.otp-input');
export const otpVerifyButton = (page: Page) => page.getByRole('button', { name: /^\s*Verify/ });

/** Fill the login form and press Login (does not handle the OTP). */
export async function submitLogin(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('#emailInput').fill(email);
  await page.locator('#passwordInput').fill(password);
  await page.locator('button[type=submit]', { hasText: 'Login' }).click();
}

export async function typeOtp(page: Page, code: string) {
  const boxes = otpBoxes(page);
  await expect(boxes.first()).toBeVisible();
  for (let i = 0; i < code.length; i++) await boxes.nth(i).fill(code[i]);
}

export function otpFrom(text: string): string {
  const m = text.match(/\b(\d{6})\b/);
  if (!m) throw new Error(`No 6-digit OTP found in: ${text.slice(0, 120)}`);
  return m[1];
}

/** Log in with password, read the OTP mail, enter it. Ends on the first page after login. */
export async function loginFull(page: Page, browser: Browser, email: string, password: string) {
  const inbox = inboxOf(email);
  const known = await snap(browser, inbox);
  await submitLogin(page, email, password);
  await expect(otpBoxes(page).first()).toBeVisible();
  const mail = await getMail(browser, inbox, known, /login code/i, 'the "Your FreightPay Login Code" mail');
  await typeOtp(page, otpFrom(mail.text));
  await otpVerifyButton(page).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });
}

/**
 * The two main accounts (supplier1000 / buyer1000). Reused across runs through created-data.xlsx.
 * If not yet known: register + verify them. If they already exist in UAT, check that the agreed password works.
 */
export async function ensureMainAccount(page: Page, browser: Browser, role: Role) {
  const email = (role === 'Supplier' ? process.env.SUPPLIER_EMAIL : process.env.BUYER_EMAIL)!;
  if (!email) throw new Error(`${role.toUpperCase()}_EMAIL is not set in .env`);
  const known = process.env.DATA_FRESH === '1' ? undefined : await dataStore.find('Users', { Email: email, Verified: true });
  if (known) return { email, password: String(known.Password) };
  const inbox = inboxOf(email);
  const mails = await snap(browser, inbox);
  await fillRegister(page, { role, email, business: `${role} 1000 Trading LLC` });
  const res = await submitRegister(page);
  if (res?.status === 200) {
    await verifyFromMail(page, browser, inbox, mails);
  } else if (res?.status === 400 && /already exists/i.test(res.body?.message ?? '')) {
    // Already registered: confirm the agreed password reaches the OTP step.
    await submitLogin(page, email, PASSWORD);
    await expect(otpBoxes(page).first(), `${email} exists in UAT but the agreed password did not reach the OTP step`).toBeVisible();
  } else {
    throw new Error(`Could not set up ${email}: ${res?.status} ${res?.body?.message ?? 'no response'}`);
  }
  await dataStore.add('Users', { Role: role, Email: email, Password: PASSWORD, Verified: true }, `ensureMainAccount-${role}`);
  return { email, password: PASSWORD };
}

/**
 * Used by UA-REG-SUPPLIER-VALID-REGISTRATION and UA-REG-BUYER-VALID-REGISTRATION: register a role with valid data and check the pop-up and email. Uses the main account
 * (supplier1000 / buyer1000) when it is not yet known; otherwise a disposable account. Records the verified account.
 */
export async function registerAndVerifyRole(page: Page, browser: Browser, role: Role, label: string) {
  const mainEmail = (role === 'Supplier' ? process.env.SUPPLIER_EMAIL : process.env.BUYER_EMAIL)!;
  const knownMain = process.env.DATA_FRESH === '1' ? undefined : await dataStore.find('Users', { Email: mainEmail, Verified: true });
  let email = knownMain ? `${uniqueInbox(label)}@yopmail.com` : mainEmail;
  let attempt: { res: ApiResult; known: Set<string> } | undefined;
  for (let i = 0; i < 2; i++) {
    const known = await snap(browser, inboxOf(email));
    await fillRegister(page, { role, email, business: `${role} Trading LLC ${label}` });
    const res = await submitRegister(page);
    attempt = { res, known };
    if (res?.status === 400 && /already exists/i.test(res.body?.message ?? '') && i === 0) {
      email = `${uniqueInbox(label)}@yopmail.com`; // the main address is taken in UAT: fall back to a disposable one
      continue;
    }
    break;
  }
  const { res, known } = attempt!;
  expect(res?.status, `registration API: ${JSON.stringify(res)}`).toBe(200);
  await expect(verificationPopup(page)).toBeVisible();
  await expect(page.getByText(/verification email to your/i)).toContainText('****');
  const mail = await getMail(browser, inboxOf(email), known, /verify your email/i, 'the "Verify Your Email" mail');
  expect(mail.sender).toMatch(/freightpay/i);
  expect(mail.text).toMatch(/Verify Email/i);
  await openVerifyLink(page, mail.links, inboxOf(email));
  await dataStore.add('Users', { Role: role, Email: email, Password: PASSWORD, Verified: true }, label);
  return email;
}

/**
 * One verified disposable account per run, shared by scenarios that only read/log in (never locks or resets it).
 * Destructive scenarios (lockout, password reset) create their own account.
 */
export async function scratchAccount(page: Page, browser: Browser) {
  const tag = `scratch-${process.env.RUN_ID ?? 'local'}`;
  const row = await dataStore.find('Users', { 'Created By': tag });
  if (row) return { email: String(row.Email), inbox: inboxOf(String(row.Email)), password: String(row.Password) };
  return createVerifiedAccount(page, browser, { label: tag.slice(0, 40), role: 'Supplier' });
}

// ---------- Forgot Password (link-based in UAT: "We'll send you a link to reset your password") ----------

export type PostCall = { url: string; status: number; message: string };

/** Record every non-GET call to the app/middleware while `fn` runs. */
export async function recordPosts(page: Page, fn: () => Promise<void>): Promise<PostCall[]> {
  const calls: PostCall[] = [];
  const handler = async (r: import('@playwright/test').Response) => {
    if (r.request().method() !== 'GET' && /flexcappro/.test(r.url())) {
      const body = await r.json().catch(() => ({}));
      calls.push({ url: r.url().replace(/^https:\/\/[^/]+/, ''), status: r.status(), message: String(body?.message ?? '') });
    }
  };
  page.on('response', handler);
  try {
    await fn();
  } finally {
    page.off('response', handler);
  }
  return calls;
}

/** Open Login, choose Forgot Password?, submit the email. Returns the calls made. */
export async function startForgotPassword(page: Page, email: string): Promise<PostCall[]> {
  await page.goto('/login');
  await page.getByText('Forgot Password?').click();
  await page.locator('#registeredEmail').fill(email);
  return recordPosts(page, async () => {
    await page.locator('button[type=submit]', { hasText: 'Submit' }).click();
    await page.waitForTimeout(2500);
  });
}

/** The link in the password-reset email (the first non-yopmail link, or the pasted link). */
export function resetLinkOf(links: string[]): string {
  const link = links.find((l) => /^https?:\/\//.test(l) && !/yopmail\.com/.test(l) && /reset|password|forgot/i.test(l)) ?? links.find((l) => /^https?:\/\//.test(l) && !/yopmail\.com/.test(l));
  if (!link) throw new Error('No reset link was found in the password-reset email');
  return link;
}

export const resetPasswordBoxes = (page: Page) => page.locator('input[type=password]');

/** On the reset page: fill new password + confirm and submit. Returns the calls made and the text seen. */
export async function setNewPassword(page: Page, password: string, confirm = password) {
  const boxes = resetPasswordBoxes(page);
  await expect(boxes.first(), 'the reset page must show password fields').toBeVisible({ timeout: 15000 });
  const n = await boxes.count();
  await boxes.nth(0).fill(password);
  if (n > 1) await boxes.nth(1).fill(confirm);
  let seen = '';
  const calls = await recordPosts(page, async () => {
    await page.locator('button[type=submit]').first().click();
    seen = await textSeen(page, 3000);
  });
  return { calls, seen, accepted: calls.some((c) => c.status >= 200 && c.status < 300) };
}

/** Try to log in only as far as the password check: true if the password reached the OTP step. */
export async function passwordWorks(page: Page, email: string, password: string): Promise<boolean> {
  await submitLogin(page, email, password);
  await page.waitForTimeout(2500);
  return otpBoxes(page).first().isVisible();
}
