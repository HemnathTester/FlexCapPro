import type { Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

// Records every user action a scenario performs (open a page, click, type, press, tick, choose, upload) together with a
// screenshot of the screen right after it. This is what fills the "Steps & Screenshots" sheet of the Excel report, for every
// module, without changing any spec. Passwords and OTP values are masked. Set NO_STEP_SHOTS=1 to turn the screenshots off.
//
// It wraps the public Page / Locator methods once per worker. Only actions on the scenario's own `page` are recorded.

export type StepRecord = { n: number; title: string; status: 'pass' | 'fail' | 'info'; at: string; ms: number; error?: string; shot?: string };

export type ApiCall = { method: string; path: string; status: number; message: string; at: string };

type Active = { page: Page; dir: string; steps: StepRecord[]; api: ApiCall[]; id: string; stop: () => void };
let active: Active | undefined;
const PATCHED = Symbol.for('flexcap.stepRecorder.patched');

const safe = (s: string) => s.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120);
const stepsRoot = () => path.resolve(process.cwd(), '..', '..', '..', 'executions', process.env.RUN_ID ?? 'local', 'steps');

export function startRecording(page: Page, id: string) {
  const dir = path.join(stepsRoot(), safe(id));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const api: ApiCall[] = [];
  // API calls that matter for the "Failed API" column: anything that is not a plain successful GET, to the application's own services.
  const onResponse = async (r: import('@playwright/test').Response) => {
    try {
      const url = r.url();
      if (!/flexcappro/.test(url)) return;
      const method = r.request().method();
      if (method === 'GET' && r.status() < 400) return;
      if (method === 'GET' && !/middleware/.test(url)) return; // ignore asset 404s
      let message = '';
      try {
        message = String((await r.json())?.message ?? '').slice(0, 140);
      } catch {
        /* not JSON */
      }
      api.push({ method, path: url.replace(/^https?:\/\/[^/]+/, ''), status: r.status(), message, at: new Date().toISOString() });
    } catch {
      /* never let evidence capture fail a scenario */
    }
  };
  const onFailed = (req: import('@playwright/test').Request) => {
    if (/flexcappro/.test(req.url()) && req.resourceType() !== 'image') {
      api.push({ method: req.method(), path: req.url().replace(/^https?:\/\/[^/]+/, ''), status: 0, message: `no response (${req.failure()?.errorText ?? 'failed'})`, at: new Date().toISOString() });
    }
  };
  page.on('response', onResponse);
  page.on('requestfailed', onFailed);
  active = { page, dir, steps: [], api, id, stop: () => { page.off('response', onResponse); page.off('requestfailed', onFailed); } };
  patch(page);
}

export function stopRecording() {
  if (!active) return;
  active.stop();
  fs.writeFileSync(path.join(active.dir, 'steps.json'), JSON.stringify({ steps: active.steps, api: active.api }, null, 2));
  active = undefined;
}

async function record(page: Page, title: string, status: StepRecord['status'], t0: number, error?: string) {
  const a = active;
  if (!a) return;
  try {
    if (page.context() !== a.page.context()) return; // another browser (for example a mail window): not this scenario's screen
  } catch {
    return;
  }
  const n = a.steps.length + 1;
  const rec: StepRecord = { n, title, status, at: new Date().toISOString(), ms: Date.now() - t0, error };
  if (process.env.NO_STEP_SHOTS !== '1') {
    try {
      const buf = await page.screenshot({ type: 'jpeg', quality: 35, timeout: 4000 });
      const file = `step-${String(n).padStart(3, '0')}.jpg`;
      fs.writeFileSync(path.join(a.dir, file), buf);
      rec.shot = file;
    } catch {
      /* the page may be closed or mid-navigation: the step is still listed, without a picture */
    }
  }
  a.steps.push(rec);
}

/** Add a named step by hand (used for whole checks, such as in the sanity). Takes a screenshot of the page. */
export async function addStep(page: Page, title: string, status: StepRecord['status'] = 'info', error?: string) {
  await record(page, title, status, Date.now(), error);
}

const mask = (selector: string, value: unknown) => (/password|otp/i.test(selector) ? '••••••' : String(value));

function describe(name: string, target: unknown, args: unknown[]): string {
  const sel = String(target);
  switch (name) {
    case 'goto':
      return `Open ${String(args[0])}`;
    case 'reload':
      return 'Reload the page';
    case 'goBack':
      return 'Go Back';
    case 'goForward':
      return 'Go Forward';
    case 'click':
      return `Click ${sel}`;
    case 'dblclick':
      return `Double-click ${sel}`;
    case 'fill':
      return `Type into ${sel}: "${mask(sel, args[0])}"`;
    case 'pressSequentially':
      return `Type into ${sel}: "${mask(sel, args[0])}"`;
    case 'press':
      return `Press ${String(args[0])} on ${sel}`;
    case 'check':
      return `Tick ${sel}`;
    case 'uncheck':
      return `Untick ${sel}`;
    case 'selectOption':
      return `Choose an option in ${sel}`;
    case 'setInputFiles':
      return `Upload a file to ${sel}`;
    default:
      return `${name} ${sel}`;
  }
}

function wrap(proto: Record<string, unknown>, name: string, pageOf: (self: any) => Page) {
  const original = proto[name] as (...a: unknown[]) => Promise<unknown>;
  if (typeof original !== 'function') return;
  proto[name] = async function (this: unknown, ...args: unknown[]) {
    const t0 = Date.now();
    try {
      const out = await original.apply(this, args);
      await record(pageOf(this), describe(name, this, args), 'pass', t0);
      return out;
    } catch (e) {
      await record(pageOf(this), describe(name, this, args), 'fail', t0, String((e as Error).message ?? e).split('\n')[0].slice(0, 200));
      throw e;
    }
  };
}

function patch(page: Page) {
  const pageProto = Object.getPrototypeOf(page) as Record<symbol | string, unknown>;
  if (!pageProto[PATCHED]) {
    pageProto[PATCHED] = true;
    for (const m of ['goto', 'reload', 'goBack', 'goForward']) wrap(pageProto as Record<string, unknown>, m, (self) => self as Page);
  }
  const locProto = Object.getPrototypeOf(page.locator('html')) as Record<symbol | string, unknown>;
  if (!locProto[PATCHED]) {
    locProto[PATCHED] = true;
    for (const m of ['click', 'dblclick', 'fill', 'pressSequentially', 'press', 'check', 'uncheck', 'selectOption', 'setInputFiles']) {
      wrap(locProto as Record<string, unknown>, m, (self) => (self as { page(): Page }).page());
    }
  }
}
