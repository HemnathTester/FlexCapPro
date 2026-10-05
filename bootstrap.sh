#!/usr/bin/env bash
# Corrected, Windows-compatible version of the bootstrap script in
# qa_automation_project_scaffold.md (Section 11). Deviations are listed in task_log.md.
# Idempotent: existing files are never overwritten.
set -euo pipefail
ROOT="$(pwd)"
echo "Scaffolding QA automation project at: $ROOT"

# --- directories -------------------------------------------------------
mkdir -p implementation/plans implementation/ai_usages
mkdir -p knowledge/doc/_inbox knowledge/release_notes
mkdir -p source/projects/playwright/{tests,pages,fixtures,utils}
mkdir -p source/projects/maestro/{subflows,flows}
mkdir -p source/projects/appium/{config,pageobjects,specs,utils}
mkdir -p reports/results/{playwright,appium,maestro} reports/reports reports/allure-report
mkdir -p executions/logs builds
touch reports/results/playwright/.gitkeep reports/results/appium/.gitkeep \
      reports/results/maestro/.gitkeep reports/reports/.gitkeep executions/logs/.gitkeep \
      knowledge/doc/_inbox/.gitkeep knowledge/release_notes/.gitkeep builds/.gitkeep \
      source/projects/playwright/pages/.gitkeep source/projects/playwright/fixtures/.gitkeep \
      source/projects/playwright/utils/.gitkeep source/projects/maestro/subflows/.gitkeep \
      source/projects/appium/utils/.gitkeep

# --- root files ----------------------------------------------------------
[ -f summary.md ] || cat > summary.md <<'EOF'
# Project Summary

**Product:** Flexcap
**Repo:** Flexcap_Automation
**QA Model:** Script-first, AI-assisted (build once → store → execute → reuse → improve)
**Engines:** Playwright (web) · Appium (mobile, programmatic) · Maestro (mobile, declarative)
**Reporting:** Allure (merged across all three engines)

## Current Coverage Snapshot
| Domain | Web (Playwright) | Mobile (Appium) | Mobile (Maestro) | Status |
|---|---|---|---|---|

## Open Gaps
- No product documents ingested yet (`knowledge/` is empty) — no real scenarios exist.
- Starter smoke tests are placeholders until real selectors / URLs are known.

## Last Updated
_(update on every AI/human pass)_
EOF

# unquoted heredoc so $(date) expands (the spec's quoted 'EOF' wrote it literally)
[ -f task_log.md ] || cat > task_log.md <<EOF
# Task Log

Chronological, one entry per meaningful change. Newest first.

## $(date +%Y-%m-%d) — Initial scaffold
- **Trigger:** Manual request — base project setup
- **Docs consulted:** qa_automation_project_scaffold.md
- **Created:** folder contract (Section 2), root/config files, starter smoke test per engine
- **Deviations from scaffold Section 11:**
  - Appium: uses the globally installed Appium 3 + its drivers (\`appium driver list\`);
    \`appium\`/driver packages removed from package.json (scaffold pinned Appium 2 / uiautomator2 3.x,
    which conflicts with Appium 3). \`ts-node\` dropped — WDIO v9 compiles TS itself.
  - iOS config kept for parity, but iOS cannot run on Windows (needs macOS + Xcode).
  - \`.env\` is loaded from the repo root explicitly (dotenv/config only looks in the cwd).
  - Reporter/output paths resolved from each config file's directory, not the cwd.
  - Maestro: \`config.yaml\` is now a valid workspace config (\`flows:\`); \`appId\` moved into the
    flows and passed via \`-e APP_ID=...\`. \`run_maestro_suite.sh\` cd's to its own folder so it
    works from the repo root. \`install_maestro.sh\` supports Windows (zip install).
  - \`.npmrc\` sets npm's script-shell to Git Bash (on this machine \`bash\` in cmd.exe is WSL).
  - \`.gitignore\` fixed so .gitkeep files are actually tracked.
  - Smoke checks: Appium asserts the foreground package equals ANDROID_APP_ID; Maestro smoke is a
    marked PLACEHOLDER (needs a real launch-screen element).
- **Skipped/Deferred:** scenario generation — no documents in knowledge/ yet.
- **Result:** not executed (no app build / device / web URL configured yet)
EOF

[ -f .env.example ] || cat > .env.example <<'EOF'
# Web
WEB_BASE_URL=https://staging.example.com

# API (used by ApiHelper for seeding/teardown across all engines)
API_BASE_URL=https://staging-api.example.com/api/v1

# Mobile app identifiers
ANDROID_APP_ID=com.example.app
IOS_BUNDLE_ID=com.example.app
# Paths are relative to the repo root
ANDROID_APP_PATH=./builds/app-debug.apk
IOS_APP_PATH=./builds/App.app

# Device targets
ANDROID_DEVICE_NAME=Pixel_8_Pro_API_35
IOS_DEVICE_NAME=iPhone 16 Pro

# Seeded test credentials (never real user data)
TEST_USER_PHONE=0000000000
TEST_USER_OTP=123456
EOF

[ -f .env ] || cp .env.example .env

[ -f .gitignore ] || cat > .gitignore <<'EOF'
node_modules/
reports/allure-report/
reports/results/*/*
!reports/results/*/.gitkeep
reports/reports/playwright-html/
executions/logs/*
!executions/logs/.gitkeep
builds/*
!builds/.gitkeep
test-results/
.env
dist/
*.log
.DS_Store
EOF

# npm runs scripts through cmd.exe on Windows, where `bash` may resolve to WSL.
# Point npm at Git Bash so the `bash source/projects/maestro/...` scripts work.
if [ ! -f .npmrc ] && [ -x "/c/Program Files/Git/bin/bash.exe" ]; then
  echo 'script-shell=C:\Program Files\Git\bin\bash.exe' > .npmrc
fi

# --- implementation/ -------------------------------------------------
[ -f implementation/plans/scenario-catalog.md ] || cat > implementation/plans/scenario-catalog.md <<'EOF'
# Scenario Catalog

| Scenario ID | Domain | Description | Engine(s) | Script Path | Status |
|---|---|---|---|---|---|
EOF

[ -f implementation/plans/regression-matrix.md ] || cat > implementation/plans/regression-matrix.md <<'EOF'
# Regression Traceability Matrix

| Requirement/Defect | Scenario ID(s) | Coverage | Notes |
|---|---|---|---|
EOF

[ -f implementation/ai_usages/ai_utilization_log.md ] || cat > implementation/ai_usages/ai_utilization_log.md <<EOF
# AI Utilization Log

One entry per AI-assisted generation/update pass.

## $(date '+%Y-%m-%d %H:%M') — Initial scaffold
- Docs read: qa_automation_project_scaffold.md (knowledge/ empty)
- Base/Sub Flows impacted: none — no product documents yet
- Reused scripts: none
- New scripts created: starter smoke tests only (no Scenario IDs assigned)
- Gaps explicitly skipped: all product scenarios — awaiting PRD/BRD/release notes
- Assumptions made: Android is the primary mobile target (Windows host, iOS not runnable)
EOF

# --- root package.json -------------------------------------------------
[ -f package.json ] || cat > package.json <<'EOF'
{
  "name": "qa-automation-suite",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["source/projects/playwright", "source/projects/appium"],
  "scripts": {
    "setup": "npm install && npm run setup:playwright && npm run setup:maestro",
    "setup:playwright": "npm --workspace source/projects/playwright run install:browsers",
    "setup:maestro": "bash source/projects/maestro/install_maestro.sh",
    "test:web": "npm --workspace source/projects/playwright test",
    "test:mobile:appium:android": "npm --workspace source/projects/appium run test:android",
    "test:mobile:appium:ios": "npm --workspace source/projects/appium run test:ios",
    "test:mobile:maestro": "bash source/projects/maestro/run_maestro_suite.sh",
    "test:all": "npm run test:web && npm run test:mobile:appium:android && npm run test:mobile:maestro",
    "report:allure": "allure generate reports/results/playwright reports/results/appium reports/results/maestro -o reports/allure-report --clean",
    "report:allure:open": "allure open reports/allure-report"
  },
  "devDependencies": { "allure-commandline": "^2.30.0" }
}
EOF

# --- playwright ----------------------------------------------------------
[ -f source/projects/playwright/package.json ] || cat > source/projects/playwright/package.json <<'EOF'
{
  "name": "qa-playwright",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "install:browsers": "playwright install --with-deps chromium",
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "report": "playwright show-report ../../../reports/reports/playwright-html",
    "build": "tsc --noEmit"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "allure-playwright": "^3.0.0",
    "typescript": "^5.5.0",
    "dotenv": "^16.4.5",
    "@types/node": "^20.14.0"
  }
}
EOF

[ -f source/projects/playwright/playwright.config.ts ] || cat > source/projects/playwright/playwright.config.ts <<'EOF'
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

const ROOT = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(ROOT, '.env') });

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: path.join(ROOT, 'reports/results/playwright') }],
    ['html', { outputFolder: path.join(ROOT, 'reports/reports/playwright-html'), open: 'never' }],
  ],
  use: {
    baseURL: process.env.WEB_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
EOF

[ -f source/projects/playwright/tsconfig.json ] || cat > source/projects/playwright/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022", "module": "commonjs", "strict": true,
    "esModuleInterop": true, "skipLibCheck": true, "outDir": "dist"
  },
  "include": ["*.ts", "tests/**/*.ts", "pages/**/*.ts", "fixtures/**/*.ts", "utils/**/*.ts"]
}
EOF

[ -f source/projects/playwright/tests/smoke.spec.ts ] || cat > source/projects/playwright/tests/smoke.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

// Starter smoke — requires WEB_BASE_URL in the root .env. Replace with a real
// Scenario ID + assertion on a known page element once the app is documented.
test('smoke: home page loads', async ({ page }) => {
  test.skip(!process.env.WEB_BASE_URL, 'WEB_BASE_URL not set in .env');
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/.+/);
});
EOF

# --- maestro ---------------------------------------------------------------
[ -f source/projects/maestro/config.yaml ] || cat > source/projects/maestro/config.yaml <<'EOF'
# Maestro workspace config. appId is declared per flow (`appId: ${APP_ID}`) and
# APP_ID / API_BASE_URL are passed in by run_maestro_suite.sh from the root .env.
flows:
  - "flows/*"
EOF

[ -f source/projects/maestro/install_maestro.sh ] || cat > source/projects/maestro/install_maestro.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
export PATH="$PATH:$HOME/.maestro/bin"
if ! command -v maestro >/dev/null 2>&1; then
  echo "Installing Maestro CLI..."
  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*)
      # The get.maestro.mobile.dev installer targets macOS/Linux; on Windows use the release zip.
      TMP_DIR="$(mktemp -d)"
      curl -fL "https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip" -o "$TMP_DIR/maestro.zip"
      unzip -q "$TMP_DIR/maestro.zip" -d "$TMP_DIR"
      rm -rf "$HOME/.maestro"
      mv "$TMP_DIR/maestro" "$HOME/.maestro"
      rm -rf "$TMP_DIR"
      echo "Installed to $HOME/.maestro — add %USERPROFILE%\\.maestro\\bin to your user PATH."
      ;;
    *)
      curl -Ls "https://get.maestro.mobile.dev" | bash
      ;;
  esac
fi
maestro --version
EOF

[ -f source/projects/maestro/run_maestro_suite.sh ] || cat > source/projects/maestro/run_maestro_suite.sh <<'EOF'
#!/usr/bin/env bash
set -uo pipefail
# Run from this script's folder so relative paths work from anywhere (e.g. repo root).
cd "$(dirname "${BASH_SOURCE[0]}")"
ROOT="$(cd ../../.. && pwd)"
export PATH="$PATH:$HOME/.maestro/bin"

# Load the root .env (APP_ID / API_BASE_URL are passed to flows as -e values)
if [ -f "$ROOT/.env" ]; then
  set -a; . "$ROOT/.env"; set +a
fi

RESULTS_DIR="$ROOT/reports/results/maestro"
LOG_DIR="$ROOT/executions/logs"
mkdir -p "$RESULTS_DIR" "$LOG_DIR"
TS=$(date +%Y-%m-%dT%H-%M-%S)
LOG_FILE="$LOG_DIR/${TS}_maestro.log"

echo "Running Maestro flows..." | tee "$LOG_FILE"
maestro test . \
  -e APP_ID="${ANDROID_APP_ID:-}" \
  -e API_BASE_URL="${API_BASE_URL:-}" \
  --format junit \
  --output "$RESULTS_DIR/maestro-results.xml" \
  2>&1 | tee -a "$LOG_FILE"
STATUS=${PIPESTATUS[0]}   # exit code of maestro, not tee
echo "Maestro run finished with exit code $STATUS" | tee -a "$LOG_FILE"
exit $STATUS
EOF
chmod +x source/projects/maestro/install_maestro.sh source/projects/maestro/run_maestro_suite.sh

[ -f source/projects/maestro/flows/00_smoke.yaml ] || cat > source/projects/maestro/flows/00_smoke.yaml <<'EOF'
# PLACEHOLDER smoke — `assertVisible: ".*"` matches anything and is NOT valid coverage
# (scaffold Section 14/15). Replace with a real launch-screen element (testID / text
# verified against the app) before this counts as a passing scenario.
appId: ${APP_ID}
tags:
  - smoke
  - placeholder
---
- launchApp
- assertVisible: ".*"
EOF

# --- appium ------------------------------------------------------------
[ -f source/projects/appium/package.json ] || cat > source/projects/appium/package.json <<'EOF'
{
  "name": "qa-appium",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc --noEmit",
    "test": "wdio run wdio.android.conf.ts",
    "test:android": "wdio run wdio.android.conf.ts",
    "test:ios": "wdio run wdio.ios.conf.ts"
  },
  "devDependencies": {
    "@wdio/cli": "^9.4.0",
    "@wdio/globals": "^9.4.0",
    "@wdio/local-runner": "^9.4.0",
    "@wdio/mocha-framework": "^9.4.0",
    "@wdio/appium-service": "^9.4.0",
    "@wdio/allure-reporter": "^9.4.0",
    "@wdio/spec-reporter": "^9.4.0",
    "@wdio/types": "^9.4.0",
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/mocha": "^10.0.7",
    "dotenv": "^16.4.5"
  }
}
EOF

[ -f source/projects/appium/tsconfig.json ] || cat > source/projects/appium/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022", "module": "commonjs", "strict": true,
    "esModuleInterop": true, "skipLibCheck": true, "resolveJsonModule": true,
    "types": ["node", "mocha", "@wdio/globals/types", "@wdio/mocha-framework"]
  },
  "include": ["pageobjects/**/*.ts", "specs/**/*.ts", "utils/**/*.ts", "*.ts"]
}
EOF

[ -f source/projects/appium/wdio.conf.ts ] || cat > source/projects/appium/wdio.conf.ts <<'EOF'
import path from 'path';
import dotenv from 'dotenv';

export const ROOT = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(ROOT, '.env') });

const RESULTS_DIR = path.join(ROOT, 'reports/results/appium');

// Base config — capabilities live in wdio.android.conf.ts / wdio.ios.conf.ts.
export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./specs/**/*.spec.ts'],
  maxInstances: 1,
  capabilities: [],
  logLevel: 'info',
  outputDir: path.join(ROOT, 'executions/logs/appium'),
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 120000 },
  reporters: [
    'spec',
    ['allure', {
      outputDir: RESULTS_DIR,
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }],
  ],
  // Uses the globally installed Appium 3 server and its drivers (`appium driver list`).
  services: [['appium', { command: 'appium' }]],
  afterTest: async function (test, _context, { passed }) {
    if (!passed) {
      await browser.saveScreenshot(
        path.join(RESULTS_DIR, `failure-${test.title.replace(/\W+/g, '_')}.png`)
      );
    }
  },
};
EOF

[ -f source/projects/appium/wdio.android.conf.ts ] || cat > source/projects/appium/wdio.android.conf.ts <<'EOF'
import path from 'path';
import { config as baseConfig, ROOT } from './wdio.conf';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  port: 4723,
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME,
    'appium:app': path.resolve(ROOT, process.env.ANDROID_APP_PATH ?? ''),
    'appium:autoGrantPermissions': true,
  }],
};
EOF

[ -f source/projects/appium/wdio.ios.conf.ts ] || cat > source/projects/appium/wdio.ios.conf.ts <<'EOF'
import path from 'path';
import { config as baseConfig, ROOT } from './wdio.conf';

// iOS requires a macOS host with Xcode — kept for parity, not runnable on Windows.
export const config: WebdriverIO.Config = {
  ...baseConfig,
  port: 4723,
  capabilities: [{
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:deviceName': process.env.IOS_DEVICE_NAME,
    'appium:app': path.resolve(ROOT, process.env.IOS_APP_PATH ?? ''),
  }],
};
EOF

[ -f source/projects/appium/config/testdata.json ] || cat > source/projects/appium/config/testdata.json <<'EOF'
{
  "users": {
    "primary": { "phone": "0000000000", "otp": "123456" }
  }
}
EOF

[ -f source/projects/appium/pageobjects/BasePage.ts ] || cat > source/projects/appium/pageobjects/BasePage.ts <<'EOF'
export default class BasePage {
  async waitForDisplayed(selector: string, timeout = 10000) {
    const el = await $(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }
}
EOF

[ -f source/projects/appium/specs/00_smoke.spec.ts ] || cat > source/projects/appium/specs/00_smoke.spec.ts <<'EOF'
describe('Smoke', () => {
  it('app launches into the foreground', async function () {
    if (!driver.isAndroid) {
      // TODO iOS: assert bundleId via `mobile: activeAppInfo` — skipped visibly, not passed.
      this.skip();
    }
    // Real, observable check: the app under test is the foreground package.
    await expect(await driver.getCurrentPackage()).toBe(process.env.ANDROID_APP_ID);
  });
});
EOF

echo "Scaffold complete. Next: npm run setup"
