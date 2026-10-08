// Builds the failures-first, scenario-wise triage report for one run (RULES.md §6).
import fs from 'node:fs';
import path from 'node:path';

function catalog(root) {
  const map = {};
  const file = path.join(root, 'implementation', 'plans', 'scenario-catalog.md');
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const c = line.split('|').map((s) => s.trim());
    if (/^[A-Z]{2,5}-[A-Z0-9-]+$/.test(c[1] ?? '')) map[c[1]] = { module: c[2], desc: c[3], type: c[4] };
  }
  return map;
}

function walk(suite, out) {
  for (const spec of suite.specs ?? []) out.push(spec);
  for (const s of suite.suites ?? []) walk(s, out);
}

export function buildReport(root, runId, moduleName) {
  const file = path.join(root, 'executions', runId, 'playwright-results.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cat = catalog(root);
  const specs = [];
  for (const s of data.suites ?? []) walk(s, specs);

  const rows = specs.map((spec) => {
    const t = spec.tests?.[0];
    const r = t?.results?.at(-1);
    const id = (spec.title.match(/^([A-Z]{2,5}-[A-Z0-9-]+)\b/) ?? [])[1] ?? spec.title;
    const ann = (t?.annotations ?? []).find((a) => a.type === 'skip' || a.type === 'fixme');
    let result = 'PASSED';
    if (t?.status === 'skipped' || r?.status === 'skipped') result = 'NOT EXECUTED';
    else if (t?.status === 'unexpected' || r?.status === 'failed' || r?.status === 'timedOut') result = 'FAILED';
    const msg = (r?.error?.message ?? '').replace(/\x1b\[[0-9;]*m/g, '').split('\n').filter(Boolean).slice(0, 3).join(' ').slice(0, 400);
    const shots = (r?.attachments ?? []).filter((a) => a.path).map((a) => path.relative(path.join(root, 'executions', runId), a.path).replace(/\\/g, '/'));
    return {
      id,
      type: cat[id]?.type ?? '?',
      desc: cat[id]?.desc ?? spec.title,
      result,
      knownDefect: /@known-defect/.test(spec.title),
      seconds: Math.round((r?.duration ?? 0) / 1000),
      note: result === 'NOT EXECUTED' ? ann?.description ?? 'skipped' : msg,
      evidence: shots,
    };
  });

  const order = { FAILED: 0, 'NOT EXECUTED': 1, PASSED: 2 };
  rows.sort((a, b) => order[a.result] - order[b.result] || Number(b.knownDefect) - Number(a.knownDefect) || a.id.localeCompare(b.id, undefined, { numeric: true }));

  const count = (f) => rows.filter(f).length;
  const byType = {};
  for (const r of rows) {
    byType[r.type] ??= { PASSED: 0, FAILED: 0, 'NOT EXECUTED': 0 };
    byType[r.type][r.result]++;
  }

  let md = `# Triage report: ${moduleName}\n\nRun: \`${runId}\`  \nAI invocations: 0 (AI diagnosis is not enabled yet; every result below is from the deterministic scripts)\n\n`;
  md += `**${rows.length} scenarios: ${count((r) => r.result === 'PASSED')} passed, ${count((r) => r.result === 'FAILED')} failed, ${count((r) => r.result === 'NOT EXECUTED')} not executed**\n\n`;
  md += `| Type | Passed | Failed | Not executed |\n|---|---|---|---|\n`;
  for (const [t, v] of Object.entries(byType)) md += `| ${t} | ${v.PASSED} | ${v.FAILED} | ${v['NOT EXECUTED']} |\n`;
  md += `\n## Scenarios (failures first)\n\n| ID | Type | Result | Time | Detail |\n|---|---|---|---|---|\n`;
  for (const r of rows) {
    const flag = r.knownDefect ? ' (known defect)' : '';
    const ev = r.evidence.length ? ` Evidence: ${r.evidence.slice(0, 2).map((e) => `\`${e}\``).join(', ')}` : '';
    md += `| ${r.id} | ${r.type} | ${r.result}${flag} | ${r.seconds}s | ${r.desc}${r.note ? `. ${r.note.replace(/\|/g, '/')}` : ''}${ev} |\n`;
  }
  fs.writeFileSync(path.join(root, 'executions', runId, 'triage.md'), md);
  fs.writeFileSync(path.join(root, 'executions', runId, 'triage.json'), JSON.stringify(rows, null, 2));
  return { rows, byType, md };
}
