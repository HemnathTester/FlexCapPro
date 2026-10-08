import type { Browser, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import { dataStore } from './dataStore';
import { yopmail } from './yopmail';
import { askUser } from './ask';
import { openMailbox } from './mailWindow';
import * as allure from 'allure-js-commons';

/** Attach a full-page screenshot to the Allure report at a key moment, so the report reads like a story. */
export async function shot(page: Page, name: string) {
  try {
    await allure.attachment(name, await page.screenshot({ fullPage: true }), { contentType: 'image/png' });
  } catch {
    /* never let evidence capture fail a scenario */
  }
}

export const PASSWORD = process.env.DEFAULT_PASSWORD || 'Test@1234';
export type Role = 'Supplier' | 'Buyer';

/**
 * UAT OTP policy (dev team decision, 2026-10-08): the backend now issues a FIXED test OTP for every login and
 * Forgot Password request, instead of a random emailed code. This applies project-wide, for every module, present
 * and future. The suite never reads yopmail or asks the person for an OTP any more (see getMail below) — it types
 * this value directly. "Verify Your Email" is unaffected: that still goes through the real emailed link.
 */
export const STATIC_OTP = process.env.STATIC_OTP || '000000';
/** A code guaranteed to differ from STATIC_OTP, for scenarios that need a deliberately WRONG OTP. */
export const WRONG_OTP = STATIC_OTP === '111111' ? '222222' : '111111';

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
  await page.waitForTimeout(800);
  await shot(page, 'After clicking Sign Up');
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
  if (!autoMail()) {
    await askToVerify(inbox);
    return '';
  }
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
  await shot(page, 'Email verified');
  return link;
}

/**
 * Mail policy (owner decision, applies to every module): the suite NEVER reads yopmail by default.
 *  - OTP codes (login, forgot password): it stops, names the mailbox to open, and the person types the code.
 *  - "Verify Your Email": it stops, names the mailbox, and the person clicks the Verify Email button in the mail (and the
 *    "Verify your email" button on the page that opens), then types "done".
 * Override for unattended runs: --auto-mail makes the suite read yopmail and open verification links itself (falls back to asking).
 */
export type MailKind = 'link' | 'otp';

export function readsAutomatically(_kind: MailKind): boolean {
  return process.env.MAIL_MODE === 'auto';
}

/** True only with --auto-mail. */
export const autoMail = () => readsAutomatically('link');

/** Ask the person to verify the account by hand: click the button in the mail, then the button on the page that opens. */
export async function askToVerify(inbox: string): Promise<void> {
  await openMailbox(inbox);
  const answer = await askUser(
    `ACTION FOR YOU: verify the account ${inbox}@yopmail.com\n  1. In your own browser open https://yopmail.com/?${inbox}\n  2. Open the "Verify Your Email" mail and click the "Verify Email" button\n  3. On the page that opens, click "Verify your email"\nType "done" here when the page says your e-mail has been verified (or "skip").`,
  );
  if (/^skip$/i.test(answer.trim())) throw new Error(`Skipped by the person running the suite: verifying ${inbox}@yopmail.com`);
}

/** IDs of mails already in the inbox. Take it BEFORE triggering the email, only for kinds the suite reads itself. */
export async function snap(browser: Browser, inbox: string, kind: MailKind = 'link'): Promise<Set<string>> {
  return readsAutomatically(kind) ? yopmail.snapshot(browser, inbox) : new Set<string>();
}

export async function getMail(browser: Browser, inbox: string, known: Set<string>, subject: RegExp, what: string, timeoutMs = 75000) {
  const kind: MailKind = /login code|otp|\bcode\b/i.test(what) ? 'otp' : 'link';
  if (kind === 'otp') {
    // Fixed test OTP (see STATIC_OTP above): no mailbox read, no window, no prompt. Never skipped, never asked.
    return { id: `static-otp-${Date.now()}`, subject: what, sender: 'static-otp', text: `Your FreightPay code is ${STATIC_OTP}.`, links: [] as string[] };
  }
  if (readsAutomatically(kind)) {
    try {
      return await yopmail.waitForNew(browser, inbox, { subject, known, timeoutMs });
    } catch {
      /* fall through to asking the person */
    }
  }
  const wantsCode = /login code|otp|code/i.test(what);
  const wantsLink = /verify|reset|link/i.test(what) && !wantsCode;
  const paste = wantsCode ? 'the 6-digit code shown in the email' : wantsLink ? 'the link behind the button in the email (right-click the button, Copy link address)' : 'the value requested';
  await openMailbox(inbox);
  const answer = await askUser(
    `ACTION FOR YOU: mailbox ${inbox}@yopmail.com\n  1. In your own browser open https://yopmail.com/?${inbox}\n  2. Open ${what}\n  3. Type here ${paste}\n(or type "skip" to skip this step)`,
  );
  if (/^skip$/i.test(answer)) throw new Error(`Skipped by the person running the suite: ${what} for ${inbox}@yopmail.com`);
  return { id: `manual-${Date.now()}`, subject: what, sender: 'manual', text: answer, links: [answer] };
}

/** Ask a yes/no or short question about the mailbox (used where the suite cannot see mail itself). */
export async function askMailbox(inbox: string, question: string): Promise<string> {
  await openMailbox(inbox);
  return askUser(`ACTION FOR YOU: mailbox ${inbox}@yopmail.com (open https://yopmail.com/?${inbox} in your own browser)\n${question}`);
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
  const known = await snap(browser, inbox, 'otp');
  await submitLogin(page, email, password);
  await expect(otpBoxes(page).first()).toBeVisible();
  await shot(page, 'OTP screen');
  const mail = await getMail(browser, inbox, known, /login code/i, 'the "Your FreightPay Login Code" mail');
  await typeOtp(page, otpFrom(mail.text));
  await otpVerifyButton(page).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, 'After login');
}

/**
 * Click Log out and confirm it. Found live on 2026-10-08: clicking "Log out" opens a confirmation dialog
 * ("Are you sure want to exit?" / Logout / No) that a plain click on "Log out" never dismisses, leaving the user
 * still signed in. Every scenario that logs out must go through this, not a bare `.click()` on "Log out".
 */
export async function logout(page: Page) {
  await page.getByText('Log out', { exact: true }).click();
  const confirm = page.getByRole('button', { name: 'Logout', exact: true });
  if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) await confirm.click();
  await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
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
  if (autoMail()) {
    const mail = await getMail(browser, inboxOf(email), known, /verify your email/i, 'the "Verify Your Email" mail');
    expect(mail.sender).toMatch(/freightpay/i);
    expect(mail.text).toMatch(/Verify Email/i);
    await openVerifyLink(page, mail.links, inboxOf(email));
  } else {
    await askToVerify(inboxOf(email));
  }
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
    await shot(page, 'After submitting Forgot Password');
  });
}

/** Password fields on the change-password step (only visible after a valid OTP). */
export const changePasswordBoxes = (page: Page) => page.locator('input[type=password]:visible');

/** After startForgotPassword: the OTP boxes are showing. Type the code and press Verify. */
export async function submitForgotOtp(page: Page, code: string) {
  await typeOtp(page, code);
  await otpVerifyButton(page).click();
  await page.waitForTimeout(2500);
}

/** True when the change-password step is showing. */
export async function reachedChangePassword(page: Page): Promise<boolean> {
  await page.waitForTimeout(1000);
  return (await changePasswordBoxes(page).count()) > 0;
}

/** On the change-password step: fill new password + confirm and submit. Returns the calls made and the text seen. */
export async function setNewPassword(page: Page, password: string, confirm = password) {
  const boxes = changePasswordBoxes(page);
  await expect(boxes.first(), 'the change-password step must show password fields').toBeVisible({ timeout: 15000 });
  const n = await boxes.count();
  await boxes.nth(0).fill(password);
  if (n > 1) await boxes.nth(1).fill(confirm);
  let seen = '';
  const calls = await recordPosts(page, async () => {
    await page.locator('button[type=submit]:visible').last().click();
    seen = await textSeen(page, 3000);
    await shot(page, 'Change password after submit');
  });
  return { calls, seen, accepted: calls.some((c) => c.status >= 200 && c.status < 300) };
}

/** Ask the person for the Forgot Password OTP (opens nothing; prints the mailbox) and return the 6 digits. */
export async function forgotOtp(_browser: Browser, _inbox: string, _known: Set<string>, _which = 'the "Forgot Password OTP" mail'): Promise<string> {
  // Fixed test OTP (STATIC_OTP): no mailbox read needed. Kept with the original signature so call sites are unchanged.
  return STATIC_OTP;
}

/** Try to log in only as far as the password check: true if the password reached the OTP step. */
export async function passwordWorks(page: Page, email: string, password: string): Promise<boolean> {
  await submitLogin(page, email, password);
  await page.waitForTimeout(2500);
  return otpBoxes(page).first().isVisible();
}

// ---------- Saved login sessions ----------
// The login needs an OTP that only the person can supply. Log in once with `npm run session:supplier` / `session:buyer`; the
// session is saved to fixtures/auth/<role>.json and later scenarios reuse it until it expires (UAT idle timeout: 30 minutes).

export const sessionFile = (role: Role) => path.resolve(process.cwd(), 'fixtures', 'auth', `${role.toLowerCase()}.json`);

/** Open a page that is already signed in as the main account of this role. Throws a clear message if the session is missing or expired. */
export async function openSession(browser: Browser, role: Role) {
  const file = sessionFile(role);
  if (!fs.existsSync(file)) throw new Error(`No saved ${role} session. Run: npm run session:${role.toLowerCase()}   (you will be asked for one OTP)`);
  const context = await browser.newContext({ storageState: file, baseURL: process.env.BASE_URL, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('/airlines/onBoarding');
  await page.waitForTimeout(2500);
  if (/\/login/.test(page.url())) {
    await context.close();
    throw new Error(`The saved ${role} session has expired. Run again: npm run session:${role.toLowerCase()}`);
  }
  return { context, page };
}
// ---------- Business Onboarding Flow Helpers ----------

export const dummyTRN = () => `100${Date.now()}003`.slice(0, 15);
export const dummyTradeLicense = () => `TL-${Date.now().toString(36).toUpperCase()}`;
export const dummyIBAN = () => `AE210330000${Date.now()}`.slice(0, 23);

export type OnboardingData = {
  legalName?: string;
  tradeName?: string;
  tradeLicense?: string;
  vatNumber?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
};

export async function gotoOnboarding(page: Page) {
  await page.goto('/onboarding').catch(() => page.goto('/airlines/onBoarding'));
  await page.waitForTimeout(1000);
}

export async function fillOnboardingStep1(page: Page, d: OnboardingData) {
  const nameInput = page.locator('#legalNameInput, input[name="legalName"], #businessNameInput').first();
  if (await nameInput.isVisible()) await nameInput.fill(d.legalName ?? 'UA Supplier Trading LLC');

  const tradeInput = page.locator('#tradeNameInput, input[name="tradeName"]').first();
  if (await tradeInput.isVisible()) await tradeInput.fill(d.tradeName ?? 'UA Supplier DBA');

  const licenseInput = page.locator('#tradeLicenseNumberInput, input[name="tradeLicenseNumber"]').first();
  if (await licenseInput.isVisible()) await licenseInput.fill(d.tradeLicense ?? dummyTradeLicense());

  const vatInput = page.locator('#vatNumberInput, input[name="vatNumber"], #trnInput').first();
  if (await vatInput.isVisible()) await vatInput.fill(d.vatNumber ?? dummyTRN());
}

export async function fillOnboardingStep2(page: Page, d: OnboardingData) {
  const contactName = page.locator('#contactNameInput, input[name="contactName"]').first();
  if (await contactName.isVisible()) await contactName.fill(d.contactName ?? 'John Doe');

  const contactEmail = page.locator('#contactEmailInput, input[name="contactEmail"]').first();
  if (await contactEmail.isVisible()) await contactEmail.fill(d.contactEmail ?? 'admin@uasupplier.com');

  const contactPhone = page.locator('#contactPhoneInput, input[name="contactPhone"]').first();
  if (await contactPhone.isVisible()) await contactPhone.fill(d.contactPhone ?? dummyPhone());
}

export async function fillOnboardingStep3(page: Page, d: OnboardingData) {
  const accInput = page.locator('#accountNumberInput, input[name="accountNumber"]').first();
  if (await accInput.isVisible()) await accInput.fill(d.accountNumber ?? '12345678901');

  const ibanInput = page.locator('#ibanInput, input[name="iban"]').first();
  if (await ibanInput.isVisible()) await ibanInput.fill(d.iban ?? dummyIBAN());

  const swiftInput = page.locator('#swiftCodeInput, input[name="swiftCode"]').first();
  if (await swiftInput.isVisible()) await swiftInput.fill(d.swiftCode ?? 'ENBDAEADXXX');
}

export async function clickWizardNext(page: Page) {
  const btn = page.getByRole('button', { name: /next|continue|proceed/i }).first();
  if (await btn.isVisible()) await btn.click();
}

export async function clickWizardBack(page: Page) {
  const btn = page.getByRole('button', { name: /back|previous/i }).first();
  if (await btn.isVisible()) await btn.click();
}

export async function submitOnboarding(page: Page): Promise<PostCall[]> {
  const submitBtn = page.getByRole('button', { name: /submit|finish|complete/i }).first();
  return recordPosts(page, async () => {
    if (await submitBtn.isVisible()) await submitBtn.click();
    await page.waitForTimeout(2500);
  });
}

