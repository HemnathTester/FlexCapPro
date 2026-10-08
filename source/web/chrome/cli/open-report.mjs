// Opens a stored Allure report in the browser.
//   npm run report -- --module=user-access                    opens the latest report for the module
//   npm run report -- --module=user-access --run=2026-10-06_14-30-00     opens one specific run
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v = 'true'] = a.slice(2).split('=');
    return [k, v];
  }),
);

const mod = args.module;
const base = path.join(root, 'reports', 'allure');
if (!mod) {
  const mods = fs.existsSync(base) ? fs.readdirSync(base) : [];
  console.error(`Missing --module=<module>. Reports exist for: ${mods.length ? mods.join(', ') : '(none yet, run a module first)'}`);
  process.exit(2);
}
const dir = path.join(base, mod, args.run ?? 'latest');
if (!fs.existsSync(path.join(dir, 'index.html'))) {
  const runs = fs.existsSync(path.join(base, mod)) ? fs.readdirSync(path.join(base, mod)) : [];
  console.error(`No report found at ${path.relative(root, dir)}. Available for ${mod}: ${runs.length ? runs.join(', ') : '(none)'}`);
  process.exit(2);
}
console.log(`Opening ${path.relative(root, dir)} (press Ctrl+C in this window to stop the report server)`);
spawn('npx', ['allure', 'open', `"${dir}"`], { cwd: path.resolve(here, '..'), stdio: 'inherit', shell: true });
