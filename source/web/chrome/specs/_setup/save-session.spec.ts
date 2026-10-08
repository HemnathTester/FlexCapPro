import { test } from '../../fixtures/base';
import fs from 'node:fs';
import path from 'node:path';
import { ensureMainAccount, loginFull, sessionFile, type Role } from '../../utils/flows';

// Setup, not a scenario. Logs in as the main account (you type the OTP when asked) and saves the signed-in session.
for (const role of ['Supplier', 'Buyer'] as Role[]) {
  test(`SESSION-${role.toUpperCase()} Log in as the main ${role} and save the session for later scenarios`, async ({ page, browser, context }) => {
    const acc = await ensureMainAccount(page, browser, role);
    await loginFull(page, browser, acc.email, acc.password);
    fs.mkdirSync(path.dirname(sessionFile(role)), { recursive: true });
    await context.storageState({ path: sessionFile(role) });
    console.log(`Saved the ${role} session to ${sessionFile(role)}`);
  });
}
