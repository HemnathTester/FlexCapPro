// Opens a stored Excel report in Excel.
//   npm run excel -- --module=user-access                               the newest report of the module
//   npm run excel -- --module=user-access --run=2026-10-08_11-41-56     one specific run (the date_time part of the file name)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v = 'true'] = a.slice(2).split('='); return [k, v]; }));
const mod = args.module;
const base = path.join(root, 'reports', 'excel_report');
if (!mod) {
  const mods = fs.existsSync(base) ? fs.readdirSync(base) : [];
  console.error('Missing --module=<module>. Excel reports exist for: ' + (mods.length ? mods.join(', ') : '(none yet, run a module first)'));
  process.exit(2);
}
const dir = path.join(base, mod);
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.startsWith(mod + '_') && n.endsWith('.xlsx')).sort() : [];
const file = args.run ? path.join(dir, mod + '_' + args.run + '.xlsx') : files.length ? path.join(dir, files[files.length - 1]) : '';
if (!file || !fs.existsSync(file)) {
  console.error('No report found. Available for ' + mod + ': ' + (files.length ? files.join(', ') : '(none)'));
  process.exit(2);
}
console.log('Opening ' + path.relative(root, file));
spawn('cmd', ['/c', 'start', '""', '"' + file + '"'], { stdio: 'ignore', shell: true, detached: true }).unref();
