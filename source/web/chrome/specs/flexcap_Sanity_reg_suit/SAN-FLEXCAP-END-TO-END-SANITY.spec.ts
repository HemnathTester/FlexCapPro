import { test, expect } from '../../fixtures/base';
import * as allure from 'allure-js-commons';
import { addStep } from '../../fixtures/stepRecorder';
import type { Page, Response } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PASSWORD, submitLogin, otpBoxes, otpVerifyButton, typeOtp, otpFrom, getMail, inboxOf, snap, textSeen, recordPosts, logout } from '../../utils/flows';

// FlexCapPro sanity, one script, one flow. Public screens first, then ONE login per role: everything that can be checked
// on that signed-in screen is checked before logging out. Read-only: it never submits an application, never changes data.
// Every check is recorded (PASS / FAIL / SKIP) and the run continues after a failure, so one run gives the whole picture.
// OTP is a fixed test value (STATIC_OTP): no OTP prompt. "Verify Your Email" (only if the account isn't verified yet)
// still asks you, naming the mailbox: up to 2 prompts, Supplier then Buyer.
// The main accounts (supplier1000 / buyer1000) must already exist and be verified: create them with the Register scenarios of user-access.

type Status = 'pass' | 'fail' | 'skip';
type Result = { id: string; phase: string; name: string; status: Status; detail: string; seconds: number };

const BACKOFFICE = process.env.BACKOFFICE_URL ?? 'https://uat.freightpay-admin.flexcappro.com';
const API = process.env.API_URL ?? 'https://uat.freightpay-middleware.flexcappro.com';

const view = async (page: Page, name: string) => {
  try {
    await allure.attachment(name, await page.screenshot(), { contentType: 'image/png' });
  } catch {
    /* evidence must never fail a check */
  }
};

test('SAN-FLEXCAP-END-TO-END-SANITY Whole-application sanity in one flow: public screens, Supplier session, Buyer session, Backoffice login page', async ({ page, browser }) => {
  test.setTimeout(30 * 60 * 1000); // includes the time you take to type two OTPs
  const results: Result[] = [];
  let phase = '';
  let n = 0;

  const check = async (name: string, fn: () => Promise<void>) => {
    const id = `S${String(++n).padStart(2, '0')}`;
    const t0 = Date.now();
    try {
      await test.step(`${id} [${phase}] ${name}`, async () => {
        await fn();
        await view(page, `${id} ${name}`);
        await addStep(page, `CHECK ${id} PASS: ${name}`, 'pass');
      });
      results.push({ id, phase, name, status: 'pass', detail: '', seconds: Math.round((Date.now() - t0) / 1000) });
    } catch (e) {
      const detail = String((e as Error).message ?? e).replace(/\x1b\[[0-9;]*m/g, '').split('\n').filter((l) => l.trim()).slice(0, 3).join(' ').slice(0, 280);
      results.push({ id, phase, name, status: 'fail', detail, seconds: Math.round((Date.now() - t0) / 1000) });
      await view(page, `${id} FAILED: ${name}`);
      await addStep(page, `CHECK ${id} FAIL: ${name}`, 'fail', detail);
    }
  };
  const skip = (name: string, why: string) => {
    const id = `S${String(++n).padStart(2, '0')}`;
    results.push({ id, phase, name, status: 'skip', detail: why, seconds: 0 });
  };

  // ============================== PHASE 1: public screens (signed out) ==============================
  phase = 'Public';

  let apiUp = false;
  await check('Backend API answers (the login API returns a normal response, not a 5xx or a timeout)', async () => {
    const res = await page.request.post(`${API}/auth/users/login`, { data: { email: 'sanity.probe@yopmail.com', password: 'Wrong@1234' }, timeout: 25000 });
    expect(res.status(), `login API answered HTTP ${res.status()} (a 5xx means the backend is down)`).toBeLessThan(500);
    apiUp = true;
  });

  await check('Login page loads with email, password, Login button and both links', async () => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/FlexCapPro/i);
    await expect(page.locator('#emailInput')).toBeVisible();
    await expect(page.locator('#passwordInput')).toBeVisible();
    await expect(page.locator('button[type=submit]', { hasText: 'Login' })).toBeVisible();
    await expect(page.getByText('Create an Account')).toBeVisible();
    await expect(page.getByText('Forgot Password?')).toBeVisible();
  });

  await check('"Create an Account" opens the Register page', async () => {
    await page.getByText('Create an Account').click();
    await expect(page).toHaveURL(/\/signup/);
  });

  await check('Register page shows both role tabs, all five fields, Sign Up and the terms link; the Buyer tab keeps the same fields', async () => {
    await expect(page.getByRole('button', { name: 'Supplier', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buyer', exact: true })).toBeVisible();
    const fields = ['#businessNameInput', '#mobileNumberInput', '#organisationEmail', '#passwordInput', '#confirmPasswordInput'];
    for (const f of fields) await expect(page.locator(f), `Supplier tab field ${f}`).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
    await expect(page.getByText('terms and conditions')).toBeVisible();
    await page.getByRole('button', { name: 'Buyer', exact: true }).click();
    for (const f of fields) await expect(page.locator(f), `Buyer tab field ${f}`).toBeVisible();
  });

  await check('Register with everything empty shows the five required messages and sends nothing', async () => {
    await page.goto('/signup');
    let sent = false;
    const watch = (r: import('@playwright/test').Request) => {
      if (/\/auth\/users$/.test(r.url()) && r.method() === 'POST') sent = true;
    };
    page.on('request', watch);
    await page.getByRole('button', { name: 'Sign Up' }).click();
    for (const msg of ['Business Name is required.', 'Mobile Number is required.', 'Email is required.', 'Password is required.', 'Confirm Password is required.']) {
      await expect(page.getByText(msg, { exact: true })).toBeVisible();
    }
    page.off('request', watch);
    expect(sent, 'an empty form must not call the registration API').toBe(false);
  });

  await check('"Login" link on the Register page returns to the Login page', async () => {
    await page.getByText('Login', { exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  await check('Forgot Password panel opens (heading, email field, Submit) and Back to Login returns', async () => {
    await page.goto('/login');
    await page.getByText('Forgot Password?').click();
    await expect(page.getByText('Forgot password', { exact: true })).toBeVisible();
    await expect(page.locator('#registeredEmail')).toBeVisible();
    await expect(page.locator('button[type=submit]', { hasText: 'Submit' })).toBeVisible();
    await page.getByText('Back to Login').click();
    await expect(page.locator('#emailInput')).toBeVisible();
  });

  if (apiUp) {
    await check('Login with an unknown email is refused with "Invalid credentials" (API 401) and no OTP step', async () => {
      let seen = '';
      const calls = await recordPosts(page, async () => {
        await submitLogin(page, `nobody.${Date.now().toString(36)}@yopmail.com`, 'Wrong@1234');
        seen = await textSeen(page, 4000);
      });
      expect(calls.some((c) => c.status === 401), `login API calls: ${JSON.stringify(calls)}`).toBe(true);
      expect(seen, 'the user must see why the login failed').toMatch(/invalid credentials/i);
      await expect(otpBoxes(page).first()).not.toBeVisible();
    });
  } else {
    skip('Login with an unknown email is refused with "Invalid credentials" (API 401) and no OTP step', 'the backend API is not answering');
  }

  await check('A protected page opened while signed out redirects to Login', async () => {
    await page.goto('/airlines/onBoarding');
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Log out')).not.toBeVisible();
  });

  await check('Backoffice login page loads (title, "Back Office Portal Login", password field, Login button)', async () => {
    const res = await page.goto(`${BACKOFFICE}/login`, { waitUntil: 'domcontentloaded' });
    expect(res?.status(), 'Backoffice login page HTTP status').toBeLessThan(400);
    await expect(page).toHaveTitle(/Back Office/i);
    await expect(page.getByText('Back Office Portal Login')).toBeVisible();
    await expect(page.locator('input[type=password]')).toBeVisible();
    await expect(page.locator('button[type=submit]', { hasText: 'Login' })).toBeVisible();
  });

  // ============================== PHASES 2 and 3: one login per role ==============================
  const WIZARD: Record<'Supplier' | 'Buyer', string[]> = {
    Supplier: ['Business Details', 'Business Info', 'Commercial License', 'Articles of Association', 'Stakeholder Details', 'Authorized Signatory Details', 'Bank Account Details', 'Account Admin'],
    Buyer: ['Business Details', 'Business Info', 'Stakeholder Details', 'Authorized Signatory Details', 'Account Admin'],
  };
  const ROLE_CHECKS = ['account is configured', 'email and password are accepted and the OTP step appears', 'correct OTP signs in', 'landing page greets the user', 'onboarding guide lists its steps', 'stays signed in after a page reload', 'session produced no server errors', 'Log out ends the session'];

  for (const role of ['Supplier', 'Buyer'] as const) {
    phase = role;
    if (!apiUp) {
      for (const c of ROLE_CHECKS) skip(`${role} ${c}`, 'the backend API is not answering, so nobody can sign in');
      continue;
    }

    const email = (role === 'Supplier' ? process.env.SUPPLIER_EMAIL : process.env.BUYER_EMAIL) ?? '';
    const password = process.env[`${role.toUpperCase()}_PASSWORD`] || PASSWORD;
    let inside = false;
    let reachedOtp = false;
    let knownMail = new Set<string>();
    const problems: string[] = [];
    const onResponse = (r: Response) => {
      if (r.status() >= 500 && /flexcappro/.test(r.url())) problems.push(`HTTP ${r.status()} ${r.url().replace(/^https:\/\/[^/]+/, '')}`);
    };
    const onPageError = (e: Error) => problems.push(`page error: ${e.message.slice(0, 100)}`);

    await check(`${role} main account is configured in .env (${role.toUpperCase()}_EMAIL)`, async () => {
      expect(email, `${role.toUpperCase()}_EMAIL is empty in .env`).toBeTruthy();
    });

    page.on('response', onResponse);
    page.on('pageerror', onPageError);

    if (email) {
      await check(`${role} email and password are accepted and the OTP step appears (6 boxes, Verify disabled)`, async () => {
        knownMail = await snap(browser, inboxOf(email), 'otp'); // before the login that sends the OTP
        await submitLogin(page, email, password);
        await expect(otpBoxes(page).first()).toBeVisible({ timeout: 20000 });
        await expect(otpBoxes(page)).toHaveCount(6);
        await expect(otpVerifyButton(page)).toBeDisabled();
        reachedOtp = true;
      });
    } else {
      skip(`${role} email and password are accepted and the OTP step appears`, 'no account configured');
    }

    if (reachedOtp) {
      await check(`${role} correct OTP signs in and lands inside the application`, async () => {
        // the OTP for the login above is already on its way: nothing is requested again
        const mail = await getMail(browser, inboxOf(email), knownMail, /login code/i, 'the "Your FreightPay Login Code" mail');
        await typeOtp(page, otpFrom(mail.text));
        await otpVerifyButton(page).click();
        await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });
        await expect(page.getByText('Log out')).toBeVisible({ timeout: 15000 });
        inside = true;
      });
    } else {
      skip(`${role} correct OTP signs in and lands inside the application`, 'the OTP step was not reached');
    }

    if (inside) {
      await check(`${role} landing page greets the user and shows the application welcome`, async () => {
        await page.waitForTimeout(1500);
        await expect(page.getByText(/^\s*Hi\b/).first()).toBeVisible();
        await expect(page.getByText(/Welcome to/i).first()).toBeVisible();
      });

      await check(`${role} onboarding guide lists its steps (${WIZARD[role].length} expected)`, async () => {
        const missing: string[] = [];
        for (const step of WIZARD[role]) if (!(await page.getByText(step, { exact: false }).first().isVisible().catch(() => false))) missing.push(step);
        expect(missing, `steps not shown: ${missing.join(', ')}`).toEqual([]);
      });

      await check(`${role} stays signed in after a page reload`, async () => {
        await page.reload();
        await page.waitForTimeout(2500);
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.getByText('Log out')).toBeVisible();
      });

      await check(`${role} session produced no server errors (HTTP 5xx) and no page errors`, async () => {
        expect(problems, problems.join(' | ')).toEqual([]);
      });

      await check(`${role} Log out ends the session (back to Login, Back button and direct URL do not restore it)`, async () => {
        await logout(page);
        await page.goBack();
        await page.waitForTimeout(1500);
        await expect(page.getByText('Log out')).not.toBeVisible();
        await page.goto('/airlines/onBoarding');
        await expect(page).toHaveURL(/\/login/);
      });
    } else {
      for (const c of ROLE_CHECKS.slice(3)) skip(`${role} ${c}`, 'not signed in');
    }

    page.off('response', onResponse);
    page.off('pageerror', onPageError);
    if (!inside) await page.context().clearCookies();
  }

  // ============================== RESULT ==============================
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail');
  const skipped = results.filter((r) => r.status === 'skip').length;
  const lines = results.map((r) => `${r.status.toUpperCase().padEnd(5)} ${r.id} [${r.phase}] ${r.name}${r.detail ? `  -> ${r.detail}` : ''}`);
  const headline = `SANITY RESULT: ${passed} passed, ${failed.length} failed, ${skipped} skipped, of ${results.length} checks`;

  const runDir = path.resolve(process.cwd(), '..', '..', '..', 'executions', process.env.RUN_ID ?? 'local');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'sanity-checks.json'), JSON.stringify(results, null, 2));
  await test.info().attach('sanity-checks', { body: `${headline}\n\n${lines.join('\n')}`, contentType: 'text/plain' });
  console.log(`\n${headline}\n${lines.join('\n')}`);

  expect(failed.length, `${headline}. Failed: ${failed.map((f) => `${f.id} ${f.name}`).join(' | ')}`).toBe(0);
});
