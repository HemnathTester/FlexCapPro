// One CLI for every run (RULES.md §2):
//   npm run test -- --product=chrome --module=<module> [--scenario=<ID or name prefix>[,<more>]] [--fresh] [--slow] [--headed] [--slowmo=<ms>] [--no-excel]
// Mail policy: the suite asks you for every OTP and for the "Verify Your Email" step (it names the mailbox). --auto-mail lets it read yopmail itself.
// --headed: show the browser window while the tests run. --slowmo=500 slows every action by 500 ms so you can follow it.
// --fresh: ignore stored data in fixtures/created-data.xlsx and create new data (new rows are still recorded).
// --slow:  also run scenarios tagged @slow (e.g. the 30-minute session timeout).
// Always ends complete (with a report) or stopped with a plain-language reason.
// In a terminal, scripts that cannot find something (e.g. an OTP) ask you for it here instead of failing.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { buildReport } from './report.mjs';
import { generateAllure } from './allure.mjs';
import { generateExcel } from './excel.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const specsDir = path.resolve(here, '../specs');
dotenv.config({ path: path.join(root, '.env') });

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v = 'true'] = a.slice(2).split('=');
    return [k, v];
  }),
);

function stop(reason) {
  console.error(`\nRun stopped: ${reason}`);
  process.exit(2);
}

const product = args.product ?? 'chrome';
const mod = args.module;
if (product !== 'chrome') stop(`unknown --product="${product}". Available: chrome.`);
if (!mod) stop('missing --module=<module>. Example: --module=user-access');
if (!fs.existsSync(path.join(specsDir, mod))) {
  stop(`no specs found at source/web/chrome/specs/${mod}/. Create scripts there first (one file per scenario ID).`);
}
if (process.env.TARGET_ENV !== 'UAT') {
  stop('tests run against UAT only. Set TARGET_ENV=UAT (and BASE_URL to the UAT address) in .env.');
}
if (!process.env.BASE_URL) {
  stop('BASE_URL is empty. Put the UAT address in .env (copy .env.example to .env if it does not exist).');
}

const runId = new Date().toISOString().replace(/[:.]/g, '-');
fs.mkdirSync(path.join(root, 'executions', runId), { recursive: true });

const pwArgs = ['playwright', 'test', `specs/${mod}`];
if (args.scenario) {
  const pattern = args.scenario.split(',').map((s) => s.trim()).filter(Boolean).join('|');
  pwArgs.push('-g', `"${pattern}"`);
}

const interactive = Boolean(process.stdin.isTTY) && args['no-ask'] !== 'true';
const child = spawn('npx', pwArgs, {
  cwd: path.resolve(here, '..'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PRODUCT: product,
    RUN_ID: runId,
    ...(args.fresh ? { DATA_FRESH: '1' } : {}),
    ...(args.slow ? { RUN_SLOW: '1' } : {}),
    ...(args.headed ? { HEADED: '1' } : {}),
    ...(args['auto-mail'] ? { MAIL_MODE: 'auto' } : {}),
    ...(args['open-mail-window'] ? { OPEN_MAIL_WINDOW: '1' } : {}),
    ...(args['ask-mail'] ? { MAIL_MODE: 'ask' } : {}),
    ...(args['no-step-shots'] ? { NO_STEP_SHOTS: '1' } : {}),
    ...(args.slowmo ? { SLOWMO: String(args.slowmo) } : {}),
    ...(interactive ? { ASK_USER: '1' } : {}),
  },
});

// Answer questions the scripts ask (executions/<runId>/ask/*.req.json -> *.ans).
const askDir = path.join(root, 'executions', runId, 'ask');
const handled = new Set();
let asking = false;
const rl = interactive ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
const watcher = interactive
  ? setInterval(() => {
      if (asking || !fs.existsSync(askDir)) return;
      for (const f of fs.readdirSync(askDir).filter((n) => n.endsWith('.req.json') && !handled.has(n))) {
        handled.add(f);
        asking = true;
        const { question } = JSON.parse(fs.readFileSync(path.join(askDir, f), 'utf8'));
        console.log(`\n>>> The run needs your help:\n${question}`);
        rl.question('> ', (answer) => {
          fs.writeFileSync(path.join(askDir, f.replace('.req.json', '.ans')), answer);
          asking = false;
        });
        break;
      }
    }, 1000)
  : null;

child.on('exit', async (code) => {
  if (watcher) clearInterval(watcher);
  rl?.close();
  const resultsFile = path.join(root, 'executions', runId, 'playwright-results.json');
  let produced = false;
  let problem = null;
  if (fs.existsSync(resultsFile)) {
    try {
      const r = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      const s = r.stats ?? {};
      const total = (s.expected ?? 0) + (s.unexpected ?? 0) + (s.flaky ?? 0) + (s.skipped ?? 0);
      if (r.errors?.length) problem = `Playwright reported ${r.errors.length} error(s) before/while running: ${r.errors.map((e) => (e.message ?? '').split(/\r?\n/)[0]).join('; ')}`;
      else if (total === 0) problem = 'no scenarios were executed (0 tests found). Check the spec files and the --scenario filter.';
      else produced = true;
    } catch {
      problem = 'the results file could not be read.';
    }
  }

  const runsFile = path.join(root, 'executions', 'execution_runs.json');
  const runs = fs.existsSync(runsFile) ? JSON.parse(fs.readFileSync(runsFile, 'utf8')) : [];
  runs.push({ runId, product, module: mod, scenario: args.scenario ?? null, exitCode: code, completed: produced });
  fs.writeFileSync(runsFile, JSON.stringify(runs, null, 2));

  if (!produced) stop(`${problem ?? `Playwright produced no results file (exit code ${code}).`} Run ${runId} is logged as not completed.`);

  const report = buildReport(root, runId, mod);
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`\n==== ${mod}: scenario results (failures first) ====`);
  for (const r of report.rows) {
    const tag = r.result === 'PASSED' ? 'PASS' : r.result === 'FAILED' ? 'FAIL' : 'SKIP';
    console.log(`${pad(tag, 5)} ${pad(r.id, 46)} ${pad(r.type, 9)} ${r.knownDefect ? '[known defect] ' : ''}${r.desc.slice(0, 90)}`);
  }
  const sanityFile = path.join(root, 'executions', runId, 'sanity-checks.json');
  if (fs.existsSync(sanityFile)) {
    const checks = JSON.parse(fs.readFileSync(sanityFile, 'utf8'));
    console.log('\n==== Sanity checks, in the order they ran ====');
    for (const c of checks) console.log(`${pad(c.status === 'pass' ? 'PASS' : c.status === 'fail' ? 'FAIL' : 'SKIP', 5)} ${pad(c.id, 4)} ${pad('[' + c.phase + ']', 11)} ${c.name}${c.detail ? '   -> ' + c.detail : ''}`);
    const tally = (st) => checks.filter((c) => c.status === st).length;
    console.log(`\nSANITY RESULT: ${tally('pass')} passed, ${tally('fail')} failed, ${tally('skip')} skipped, of ${checks.length} checks`);
    const md = ['', '## Sanity checks', '', '| # | Phase | Result | Check | Detail |', '|---|---|---|---|---|', ...checks.map((c) => `| ${c.id} | ${c.phase} | ${c.status.toUpperCase()} | ${c.name} | ${(c.detail || '').replace(/\|/g, '/')} |`)].join('\n');
    fs.appendFileSync(path.join(root, 'executions', runId, 'triage.md'), md + '\n');
  }
  console.log('\nBy type:');
  for (const [t, v] of Object.entries(report.byType)) console.log(`  ${pad(t, 9)} passed ${v.PASSED}, failed ${v.FAILED}, not executed ${v['NOT EXECUTED']}`);
  const allure = generateAllure({ root, runId, mod, chromeDir: path.resolve(here, '..') });
  if (allure.error) console.log(`\nAllure report could not be built: ${allure.error}`);
  else console.log(`\nAllure report: ${path.relative(root, path.join(allure.out, 'index.html'))}   Open it with: npm run report -- --module=${mod}`);
  if (args['no-excel'] !== 'true') {
    try {
      const xl = await generateExcel({ root, runId, mod, rows: report.rows, stamp: allure.stamp });
      console.log('\nExcel report: ' + path.relative(root, xl.file) + '   (' + xl.total + ' test cases: ' + xl.pass + ' PASS, ' + xl.fail + ' FAIL; ' + xl.steps + ' steps with ' + xl.shots + ' screenshots; open bugs: ' + xl.openBugs + ')');
    } catch (e) {
      console.log('\nExcel report could not be built: ' + String(e).split('\n')[0]);
    }
  }
  console.log(`\nRun ${runId} complete. Triage report: executions/${runId}/triage.md   Evidence: reports/results/${product}/${runId}/`);
  process.exit(code ?? 1);
});
