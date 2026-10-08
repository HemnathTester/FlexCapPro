// Builds the Allure HTML report for one run and stores it by module and date-time:
//   reports/allure/<module>/<YYYY-MM-DD_HH-mm-ss>/index.html      (this run)
//   reports/allure/<module>/latest/                               (copy of the newest run, also keeps trend history)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const pad = (n) => String(n).padStart(2, '0');

export function generateAllure({ root, runId, mod, chromeDir }) {
  const results = path.join(root, 'executions', runId, 'allure-results');
  if (!fs.existsSync(results) || fs.readdirSync(results).length === 0) return { error: 'no Allure results were produced for this run' };

  const now = new Date();
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const readable = now.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' });
  const modDir = path.join(root, 'reports', 'allure', mod);
  const out = path.join(modDir, stamp);
  const latest = path.join(modDir, 'latest');

  // Trend/history: carry over the previous report's history so Allure can show run-over-run trends.
  const prevHistory = path.join(latest, 'history');
  if (fs.existsSync(prevHistory)) fs.cpSync(prevHistory, path.join(results, 'history'), { recursive: true });

  // Shown in the report's "Executors" widget.
  fs.writeFileSync(
    path.join(results, 'executor.json'),
    JSON.stringify({ name: 'FlexCap CLI', type: 'cli', buildName: `${mod} regression, ${readable}`, reportName: `FlexCapPro ${mod} (UAT)`, buildOrder: Date.now() }),
  );

  fs.mkdirSync(modDir, { recursive: true });
  const gen = spawnSync('npx', ['allure', 'generate', `"${results}"`, '-o', `"${out}"`, '--clean', '--report-name', `"FlexCapPro ${mod} (UAT) ${readable}"`], {
    cwd: chromeDir,
    shell: true,
    encoding: 'utf8',
  });
  if (gen.status !== 0 || !fs.existsSync(path.join(out, 'index.html'))) {
    return { error: `allure generate failed: ${(gen.stderr || gen.stdout || '').split('\n').filter(Boolean).slice(-3).join(' ')}` };
  }

  fs.rmSync(latest, { recursive: true, force: true });
  fs.cpSync(out, latest, { recursive: true });
  return { out, latest, stamp };
}
