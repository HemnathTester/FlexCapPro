// Builds the Excel test report for one run, for any module.
//   reports/excel_report/<module>/<module>_<YYYY-MM-DD>_<HH-mm-ss>.xlsx            the report (file name = module + date + time)
//   reports/excel_report/<module>/<module>_<YYYY-MM-DD>_<HH-mm-ss>_evidence/       every step screenshot of that run
//   reports/excel_report/<module>/bugs.json, history.json                          kept between runs (defect list, run history)
// Sheets: Test Execution (the owner's 20 columns) | Summary | Steps & Screenshots | Bug List | Run History | Sanity Checks.
import ExcelJS from 'exceljs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const AREA = {
  REG: 'Register', LOGIN: 'Login', FP: 'Forgot Password',
  BIZINFO: 'Business Info', LOGO: 'Business Logo', UPLOAD: 'Document Uploads', STAKEHOLDER: 'Stakeholder Details', SIGNATORY: 'Authorized Signatory',
  BANK: 'Bank Account', ADMIN: 'Account Admin', INVOICE: 'Invoice Templates', TERMS: 'Terms & Conditions', STEPPER: 'Stepper & Progress', STEP: 'Stepper & Progress',
  SAVE: 'Save Draft & Resume', REVIEW: 'Review & Submit', SUPPLIER: 'Submission', BUYER: 'Submission', ALTERNATE: 'Alternate Email', STATUS: 'Status Navigation',
  FLEXCAP: 'Sanity',
};
const screenOf = (id) => AREA[(id.split('-')[1] ?? '').toUpperCase()] ?? (id.split('-')[1] ?? '');

const clean = (s) => String(s ?? '').replace(/\x1b\[[0-9;]*m/g, '').trim();
// markdown from the test-case documents -> plain text for Excel cells
const md = (s) => String(s ?? '').replace(/\*\*/g, '').replace(/`/g, '').split('\n').map((l) => l.trimEnd()).join('\n').replace(/^\s*\n/, '').trim();
const pad = (n) => String(n).padStart(2, '0');
const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const stampNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};
const dur = (sec) => (sec >= 60 ? `${Math.floor(sec / 60)} m ${pad(sec % 60)} s` : `${sec} s`);
const readJson = (f, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return fallback;
  }
};

// ---- documented test cases (steps, data, expected result) from implementation/plans/testcases/*-TestCases.md
function parseTestcases(root) {
  const dir = path.join(root, 'implementation', 'plans', 'testcases');
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const file of fs.readdirSync(dir).filter((n) => /TestCases\.md$/.test(n))) {
    const blocks = fs.readFileSync(path.join(dir, file), 'utf8').split(/^### TC-/m).slice(1);
    for (const block of blocks) {
      const lines = block.split('\n');
      const id = lines[0].split(' — ')[0].trim();
      const rec = {};
      let key = null;
      for (const line of lines.slice(1)) {
        const pt = line.match(/^- \*\*Priority:\*\*\s*([^.*]+)\.?\s*\*\*Type:\*\*\s*(.*)$/);
        if (pt) {
          rec.priority = pt[1].trim();
          rec.type = pt[2].replace(/\.\s.*$/, '').trim();
          key = null;
          continue;
        }
        const m = line.match(/^- \*\*([^:*]+):\*\*\s*(.*)$/);
        if (m) {
          key = m[1].trim().toLowerCase();
          rec[key] = m[2];
        } else if (key && line.trim() && !line.startsWith('###') && !line.startsWith('---')) {
          rec[key] += `\n${line.trim()}`;
        }
      }
      out[id] = rec;
    }
  }
  return out;
}

// ---- Playwright results by scenario id
function loadResults(root, runId) {
  const data = readJson(path.join(root, 'executions', runId, 'playwright-results.json'), { suites: [], stats: {} });
  const byId = {};
  const walk = (s) => {
    for (const sp of s.specs ?? []) {
      const id = (sp.title.match(/^([A-Z]{2,5}-[A-Z0-9-]+)\b/) ?? [])[1] ?? sp.title;
      const t = sp.tests?.[0];
      const r = t?.results?.at(-1);
      byId[id] = {
        start: r?.startTime ?? data.stats?.startTime,
        ms: r?.duration ?? 0,
        error: clean(r?.error?.message).split('\n').filter(Boolean).slice(0, 4).join(' '),
        screenshot: (r?.attachments ?? []).find((a) => a.path && /image\//.test(a.contentType ?? ''))?.path,
        file: sp.file,
      };
    }
    for (const c of s.suites ?? []) walk(c);
  };
  for (const s of data.suites ?? []) walk(s);
  return { byId, start: data.stats?.startTime, ms: data.stats?.duration ?? 0 };
}

const loadSteps = (root, runId, id) => {
  const dir = path.join(root, 'executions', runId, 'steps', id.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120));
  const j = readJson(path.join(dir, 'steps.json'), { steps: [], api: [] });
  return { dir, steps: Array.isArray(j) ? j : j.steps ?? [], api: Array.isArray(j) ? [] : j.api ?? [] };
};

// ---- issue classification (automatic; the report says so)
function classify(c) {
  if (c.status !== 'FAIL') return '';
  const text = `${c.actual} ${c.failedStepError}`.toLowerCase();
  if (c.api.some((a) => a.status >= 500 || a.status === 0) || /bad gateway|\b50[0-4]\b|backend|not answering/.test(text)) return 'Environment / Backend';
  if (c.knownDefect) return 'Functional (known defect)';
  if (/accepted|rejected without|no visible message|was still accepted|not locked|not rejected/.test(text)) return 'Validation / Functional';
  if (/timeout|locator|strict mode|not visible|waiting for|resolved to|tobevisible|tohaveurl/.test(text)) return 'Automation / Script (verify)';
  return 'Functional';
}
const severityOf = (c) => {
  if (c.status !== 'FAIL') return '';
  if (c.issueType === 'Environment / Backend') return 'Blocker';
  if (c.issueType.startsWith('Automation')) return 'Low';
  return /high/i.test(c.priority) ? 'High' : /low/i.test(c.priority) ? 'Low' : 'Medium';
};
const failedApiText = (api) =>
  [...new Set(api.filter((a) => a.status >= 400 || a.status === 0).map((a) => `${a.method} ${a.path} -> ${a.status || 'no response'}${a.message ? ` "${a.message}"` : ''}`))].slice(0, 5).join('\n');

// ---- styling
const HEAD = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
const FILL = {
  PASS: 'FFC6EFCE', FAIL: 'FFFFC7CE', 'NOT EXECUTED': 'FFEDEDED', Open: 'FFFFC7CE', Resolved: 'FFC6EFCE',
  Blocker: 'FFFF9999', High: 'FFFFC7CE', Medium: 'FFFFEB9C', Low: 'FFDDEBF7',
};
const BORDER = { top: { style: 'thin', color: { argb: 'FFBFBFBF' } }, left: { style: 'thin', color: { argb: 'FFBFBFBF' } }, bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } }, right: { style: 'thin', color: { argb: 'FFBFBFBF' } } };

function sheet(wb, name, columns) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1, xSplit: columns.length > 12 ? 2 : 0 }] });
  ws.columns = columns.map(([header, width]) => ({ header, width }));
  const row = ws.getRow(1);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = HEAD;
  row.alignment = { vertical: 'middle', wrapText: true };
  row.height = 28;
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  return ws;
}
const colour = (cell, key) => {
  if (FILL[key]) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILL[key] } };
  cell.font = { bold: true };
};
const style = (row, cols) => {
  row.alignment = { vertical: 'top', wrapText: true };
  for (let c = 1; c <= cols; c++) row.getCell(c).border = BORDER;
};

// The owner's header, in the owner's order.
const MAIN = [
  ['S.No', 7], ['Test Case ID', 36], ['Module', 24], ['Test Scenario', 44], ['Test Steps', 52], ['Expected Result', 42], ['Actual Result', 46], ['Status', 14],
  ['Issue Type', 22], ['Issue Description', 50], ['Failed API', 44], ['Defect ID', 16], ['Severity', 11], ['Screenshot', 36], ['Executed On', 19], ['Duration', 11],
  ['Priority', 10], ['Scenario Type', 13], ['Technical Details (QA)', 72], ['Run ID', 28],
];

export async function generateExcel({ root, runId, mod, rows, stamp: givenStamp }) {
  const stamp = givenStamp ?? stampNow();
  const res = loadResults(root, runId);
  const docs = parseTestcases(root);
  const sanity = readJson(path.join(root, 'executions', runId, 'sanity-checks.json'), null);
  const now = new Date();
  const started = res.start ? new Date(res.start) : now;
  const modDir = path.join(root, 'reports', 'excel_report', mod);
  const baseName = `${mod}_${stamp}`;
  const file = path.join(modDir, `${baseName}.xlsx`);
  const evidenceDir = path.join(modDir, `${baseName}_evidence`);
  fs.mkdirSync(modDir, { recursive: true });

  const stepsSrc = path.join(root, 'executions', runId, 'steps');
  if (fs.existsSync(stepsSrc)) fs.cpSync(stepsSrc, evidenceDir, { recursive: true });

  // ---- one record per test case
  const cases = rows.map((r, i) => {
    const d = docs[r.id] ?? {};
    const x = res.byId[r.id] ?? {};
    const { dir, steps, api } = loadSteps(root, runId, r.id);
    const status = r.result === 'PASSED' ? 'PASS' : r.result === 'FAILED' ? 'FAIL' : 'NOT EXECUTED';
    const failedStep = [...steps].reverse().find((s) => s.status === 'fail');
    const lastShot = [...steps].reverse().find((s) => s.shot);
    const failFile = failedStep?.shot ? path.join(dir, failedStep.shot) : lastShot ? path.join(dir, lastShot.shot) : null;
    const shot = failFile ? { file: failFile, ext: 'jpeg' } : x.screenshot && fs.existsSync(x.screenshot) ? { file: x.screenshot, ext: 'png' } : null;
    const actual = status === 'PASS' ? 'As expected.' : clean(r.note || x.error) || (status === 'FAIL' ? 'Failed (no message captured).' : 'Not executed.');

    let stepsText = md(d['steps']);
    let expected = md(d['expected result']);
    if (!stepsText && r.id.startsWith('SAN-') && sanity) stepsText = sanity.map((c) => `${c.id} [${c.phase}] ${c.name}`).join('\n');
    if (!expected && r.id.startsWith('SAN-') && sanity) expected = `All ${sanity.length} checks PASS.`;
    if (!stepsText) stepsText = steps.slice(0, 25).map((s) => `${s.n}. ${s.title}`).join('\n') || '(no steps recorded)';

    const c = {
      sno: i + 1,
      id: r.id,
      screen: screenOf(r.id),
      scenario: r.desc,
      stepsText,
      expected,
      actual,
      status,
      priority: d.priority ?? '',
      type: r.type !== '?' ? r.type : d.type ?? '',
      executedAt: x.start ? local(new Date(x.start)) : local(now),
      seconds: r.seconds ?? Math.round((x.ms ?? 0) / 1000),
      steps,
      stepDir: dir,
      api,
      failedStepText: failedStep ? `#${failedStep.n} ${failedStep.title}` : '',
      failedStepError: failedStep?.error ?? '',
      shot,
      knownDefect: Boolean(r.knownDefect),
      script: x.file ? `source/web/chrome/specs/${x.file.replace(/\\/g, '/')}` : '',
      remarks: d.notes ? md(d.notes).split('\n')[0] : '',
    };
    c.issueType = classify(c);
    c.severity = severityOf(c);
    c.failedApi = c.status === 'FAIL' ? failedApiText(api) : '';
    c.issueDescription =
      c.status === 'FAIL'
        ? [`${c.scenario}.`, `Expected: ${c.expected || 'see test steps'}`, `Actual: ${c.actual}`, c.failedStepText ? `Failed at step ${c.failedStepText}${c.failedStepError ? ` (${c.failedStepError})` : ''}` : '', c.knownDefect ? 'Known defect from the manual run.' : '']
            .filter(Boolean)
            .join('\n')
        : c.status === 'NOT EXECUTED'
          ? c.actual
          : '';
    c.technical = [
      `Script: ${c.script || '(n/a)'}`,
      `Steps run: ${steps.length}, screenshots: ${steps.filter((s) => s.shot).length}. Evidence: reports/excel_report/${mod}/${baseName}_evidence/${path.basename(dir)}/`,
      c.failedStepText ? `Failed step: ${c.failedStepText}${c.failedStepError ? `\nStep error: ${c.failedStepError}` : ''}` : '',
      c.status === 'FAIL' ? `Error: ${c.actual.slice(0, 400)}` : '',
      c.status === 'FAIL' && c.failedApi ? `API calls with errors:\n${c.failedApi}` : '',
      `Browser: Google Chrome (desktop). Environment: ${process.env.TARGET_ENV ?? 'UAT'} ${process.env.BASE_URL ?? ''}`,
      c.remarks ? `Notes: ${c.remarks}` : '',
      c.issueType ? 'Issue Type is classified automatically from the failure text: please confirm it.' : '',
    ]
      .filter(Boolean)
      .join('\n');
    return c;
  });

  // ---- defect registry (kept between runs)
  const bugsFile = path.join(modDir, 'bugs.json');
  const reg = readJson(bugsFile, { seq: 0, bugs: {} });
  for (const c of cases) {
    const prefix = c.id.split('-')[0];
    const b = reg.bugs[c.id];
    if (c.status === 'FAIL') {
      if (!b) {
        reg.seq += 1;
        reg.bugs[c.id] = { bugId: `BUG-${prefix}-${String(reg.seq).padStart(3, '0')}`, first: local(now), count: 0 };
      }
      const bug = reg.bugs[c.id];
      Object.assign(bug, {
        id: c.id, screen: c.screen, title: c.scenario, issueType: c.issueType, severity: c.severity, status: 'Open', last: local(now), lastRun: runId, stamp,
        expected: c.expected, actual: c.actual, issue: c.issueDescription, failedApi: c.failedApi, failedStep: c.failedStepText, knownDefect: c.knownDefect,
      });
      bug.count += 1;
      delete bug.resolved;
      c.defectId = bug.bugId;
    } else if (c.status === 'PASS' && b && b.status === 'Open') {
      b.status = 'Resolved';
      b.resolved = local(now);
      c.defectId = `${b.bugId} (resolved)`;
    } else if (b) {
      c.defectId = b.bugId;
    }
    c.defectId ??= '';
  }
  fs.writeFileSync(bugsFile, JSON.stringify(reg, null, 2));

  // ---- run history (kept between runs)
  const histFile = path.join(modDir, 'history.json');
  const hist = readJson(histFile, []);
  hist.push({ runId, stamp, at: local(now), results: cases.map((c) => ({ id: c.id, screen: c.screen, status: c.status, seconds: c.seconds, bug: c.defectId })) });
  fs.writeFileSync(histFile, JSON.stringify(hist.slice(-200), null, 2));

  // ================= workbook =================
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FlexCap automation';
  wb.created = now;

  // ---- Test Execution: the owner's header and order
  const te = sheet(wb, 'Test Execution', MAIN);
  for (const c of cases) {
    const row = te.addRow([
      c.sno, c.id, `${mod} / ${c.screen}`, c.scenario, c.stepsText, c.expected, c.actual, c.status, c.issueType, c.issueDescription, c.failedApi, c.defectId, c.severity, '',
      c.executedAt, dur(c.seconds), c.priority, c.type, c.technical, runId,
    ]);
    style(row, MAIN.length);
    colour(row.getCell(8), c.status);
    if (c.severity) colour(row.getCell(13), c.severity);
    row.height = c.shot ? 140 : 90;
    if (c.shot) {
      const img = wb.addImage({ buffer: fs.readFileSync(c.shot.file), extension: c.shot.ext });
      te.addImage(img, { tl: { col: 13.05, row: row.number - 1 + 0.05 }, ext: { width: 245, height: 138 } });
    }
  }

  // ---- Summary
  const total = cases.length;
  const n = (st) => cases.filter((c) => c.status === st).length;
  const pass = n('PASS');
  const fail = n('FAIL');
  const stepCount = cases.reduce((a, c) => a + c.steps.length, 0);
  const shotCount = cases.reduce((a, c) => a + c.steps.filter((s) => s.shot).length, 0);
  const openBugs = Object.values(reg.bugs).filter((b) => b.status === 'Open').length;
  const sum = wb.addWorksheet('Summary');
  sum.columns = [{ width: 32 }, { width: 30 }, { width: 14 }, { width: 14 }, { width: 16 }];
  sum.mergeCells('A1:E1');
  sum.getCell('A1').value = `FlexCapPro: Test Execution Report, ${mod}`;
  sum.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF1F3864' } };
  const info = [
    ['Module', mod], ['Environment', `${process.env.TARGET_ENV ?? 'UAT'}  ${process.env.BASE_URL ?? ''}`], ['Browser', 'Google Chrome (desktop)'], ['Run ID', runId],
    ['Run started', local(started)], ['Report created', local(now)], ['Duration', dur(Math.round((res.ms || 0) / 1000))], ['Executed by', `${os.userInfo().username} on ${os.hostname()}`],
    [], ['Total test cases', total], ['PASS', pass], ['FAIL', fail], ['NOT EXECUTED', n('NOT EXECUTED')],
    ['Pass rate (pass / executed)', pass + fail ? `${Math.round((pass / (pass + fail)) * 100)} %` : 'n/a'], ['Open defects (all runs)', openBugs],
    ['Steps recorded / screenshots', `${stepCount} / ${shotCount}`],
  ];
  info.forEach((r, i) => {
    const row = sum.getRow(3 + i);
    r.forEach((v, c) => (row.getCell(c + 1).value = v));
    row.getCell(1).font = { bold: true };
  });
  colour(sum.getCell('B13'), 'PASS');
  colour(sum.getCell('B14'), 'FAIL');
  colour(sum.getCell('B15'), 'NOT EXECUTED');
  let r0 = 3 + info.length + 1;
  const table = (title, keyFn) => {
    const keys = [...new Set(cases.map(keyFn))];
    sum.getRow(r0).getCell(1).value = title;
    sum.getRow(r0).font = { bold: true };
    r0 += 1;
    const h = sum.getRow(r0);
    ['', 'Total', 'PASS', 'FAIL', 'NOT EXECUTED'].forEach((v, c) => {
      h.getCell(c + 1).value = v;
      h.getCell(c + 1).fill = HEAD;
      h.getCell(c + 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });
    r0 += 1;
    for (const k of keys) {
      const sub = cases.filter((c) => keyFn(c) === k);
      const row = sum.getRow(r0++);
      [k || 'Unspecified', sub.length, sub.filter((c) => c.status === 'PASS').length, sub.filter((c) => c.status === 'FAIL').length, sub.filter((c) => c.status === 'NOT EXECUTED').length].forEach((v, c) => (row.getCell(c + 1).value = v));
    }
    r0 += 1;
  };
  table('By scenario type', (c) => c.type);
  table('By screen', (c) => c.screen);

  // ---- Steps & Screenshots
  const st = sheet(wb, 'Steps & Screenshots', [['Test Case ID', 38], ['Module', 24], ['Step #', 8], ['Step (what was done)', 60], ['Result', 10], ['Time', 19], ['Duration (ms)', 12], ['Error', 40], ['Screenshot', 40]]);
  for (const c of cases) {
    if (!c.steps.length) {
      const row = st.addRow([c.id, `${mod} / ${c.screen}`, '', c.status === 'NOT EXECUTED' ? `Not executed: ${c.actual}` : 'No browser steps were recorded for this test case.', c.status === 'NOT EXECUTED' ? 'SKIP' : '', '', '', '', '']);
      style(row, 9);
      continue;
    }
    for (const s of c.steps) {
      const result = s.status === 'pass' ? 'PASS' : s.status === 'fail' ? 'FAIL' : 'INFO';
      const row = st.addRow([c.id, `${mod} / ${c.screen}`, s.n, s.title, result, local(new Date(s.at)), s.ms, s.error ?? '', '']);
      style(row, 9);
      colour(row.getCell(5), result);
      if (s.shot && fs.existsSync(path.join(c.stepDir, s.shot))) {
        row.height = 118;
        const img = wb.addImage({ buffer: fs.readFileSync(path.join(c.stepDir, s.shot)), extension: 'jpeg' });
        st.addImage(img, { tl: { col: 8.05, row: row.number - 1 + 0.05 }, ext: { width: 245, height: 138 } });
      } else {
        row.height = 30;
      }
    }
  }

  // ---- Bug List (all runs; open first)
  const bl = sheet(wb, 'Bug List', [
    ['Defect ID', 16], ['Test Case ID', 38], ['Module', 24], ['Test Scenario', 44], ['Issue Type', 22], ['Severity', 11], ['Status', 11], ['First Seen', 19], ['Last Seen', 19], ['Times Failed', 11],
    ['Issue Description', 50], ['Failed API', 44], ['Expected Result', 40], ['Actual Result', 46], ['Failed Step', 40], ['Run ID', 28], ['Screenshot (this run)', 36],
  ]);
  const bugs = Object.values(reg.bugs).sort((a, b) => (a.status === b.status ? a.bugId.localeCompare(b.bugId) : a.status === 'Open' ? -1 : 1));
  for (const b of bugs) {
    const row = bl.addRow([b.bugId, b.id, `${mod} / ${b.screen}`, b.title, b.issueType, b.severity, b.status, b.first, b.last, b.count, b.issue, b.failedApi, b.expected, b.actual, b.failedStep, b.lastRun, '']);
    style(row, 17);
    colour(row.getCell(7), b.status);
    if (b.severity) colour(row.getCell(6), b.severity);
    const here = cases.find((c) => c.id === b.id && c.status === 'FAIL' && c.shot);
    row.height = here ? 140 : 70;
    if (here) {
      const img = wb.addImage({ buffer: fs.readFileSync(here.shot.file), extension: here.shot.ext });
      bl.addImage(img, { tl: { col: 16.05, row: row.number - 1 + 0.05 }, ext: { width: 245, height: 138 } });
    }
  }
  if (!bugs.length) bl.addRow(['No defects recorded yet: every executed test case passed.']);

  // ---- Run History
  const rh = sheet(wb, 'Run History', [['Run Date / Time', 20], ['Run ID', 28], ['Test Case ID', 38], ['Module', 24], ['Status', 14], ['Duration (s)', 11], ['Defect ID', 18]]);
  for (const h of [...hist].reverse()) {
    for (const r of h.results) {
      const row = rh.addRow([h.at, h.runId, r.id, `${mod} / ${r.screen}`, r.status, r.seconds, r.bug]);
      style(row, 7);
      colour(row.getCell(5), r.status);
    }
  }

  // ---- Sanity Checks (only when this run was the sanity)
  if (sanity) {
    const sc = sheet(wb, 'Sanity Checks', [['Check', 8], ['Phase', 12], ['Check description', 80], ['Result', 10], ['Detail', 60], ['Seconds', 10]]);
    for (const c of sanity) {
      const row = sc.addRow([c.id, c.phase, c.name, c.status.toUpperCase(), c.detail, c.seconds]);
      style(row, 6);
      colour(row.getCell(4), c.status === 'pass' ? 'PASS' : c.status === 'fail' ? 'FAIL' : 'NOT EXECUTED');
    }
  }

  await wb.xlsx.writeFile(file);
  return { file, total, pass, fail, steps: stepCount, shots: shotCount, openBugs };
}
