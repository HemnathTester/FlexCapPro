# QA Automation Project Scaffold — AI-Driven, Playwright + Appium + Maestro

> **What this file is.** A single, self-contained blueprint for bootstrapping a script-first,
> AI-driven QA automation repository. It merges the process defined in *AI-Driven QA Execution
> Model* (build once → store → execute → reuse → improve) with the dual-engine mobile strategy
> (Maestro + Appium) and adds Playwright for web, Allure for reporting, and a fixed folder
> contract so an AI agent (or a human) can generate, extend, and maintain the codebase
> predictably release after release.
>
> **How to use it.** Read Section 0 first — it is the instruction manual. Everything after
> that (folder contract, dependency manifests, config scaffolds, bootstrap script, execution
> commands) is the material the instruction manual tells you to use.

---

## Table of Contents

0. [Instruction Manual — Bootstrapping a Project From This File](#0-instruction-manual)
1. [AI Agent Bootstrap Prompt (copy-paste)](#1-ai-agent-bootstrap-prompt)
2. [Canonical Folder Contract](#2-canonical-folder-contract)
3. [Root-Level Files](#3-root-level-files)
4. [`implementation/` — Plans & AI Usage Audit Trail](#4-implementation)
5. [`knowledge/` — Source of Truth Documents](#5-knowledge)
6. [`source/projects/` — Automation Engines](#6-sourceprojects)
7. [`reports/` — Results & Allure](#7-reports)
8. [`executions/` — Run Logs](#8-executions)
9. [Dependency Manifests (full file contents)](#9-dependency-manifests)
10. [Config Scaffolds (full file contents)](#10-config-scaffolds)
11. [`bootstrap.sh` — One-Shot Scaffolding Script](#11-bootstrapsh)
12. [Execution Commands Cheat Sheet](#12-execution-commands-cheat-sheet)
13. [AI-Driven QA Workflow Mapped to This Repo](#13-ai-driven-qa-workflow-mapped-to-this-repo)
14. [Scenario Design & Coverage Rules](#14-scenario-design--coverage-rules)
15. [Evidence, Reporting & Failure Classification](#15-evidence-reporting--failure-classification)
16. [Governance & Time/Cost Control](#16-governance--timecost-control)

---

<a id="0-instruction-manual"></a>
## 0. Instruction Manual — Bootstrapping a Project From This File

This file is **not** documentation to read once and file away — it is the seed you hand to an
AI coding agent (or run yourself) to stand up a real, working QA automation repository,
pre-loaded with whatever project documents your team already has (PRDs, BRDs, release notes,
existing manual test cases, an existing regression plan, etc.).

### Step 1 — Create the empty repository

Create (or clone) an empty Git repository. Copy this file into its root as
`qa_automation_project_scaffold.md`. Do **not** delete it after bootstrapping — it stays as the
canonical reference for the folder contract and is what every future AI-assisted run re-reads
before adding new scenarios or scripts.

### Step 2 — Drop in the tester-provided project documents

Before generating anything, gather whatever documents the tester/QA lead/PM already has:
PRDs, BRDs, release notes, dev change summaries, existing manual test plans, defect logs,
architecture notes, screenshots of flows, API collections, etc. Place them here **before**
running the bootstrap step, so the AI agent ingests them on the first pass:

- Requirements, business rules, architecture notes → `knowledge/doc/`
- Release notes / changelogs / dev summaries per version → `knowledge/release_notes/`
- Any existing test plan(s) you want folded in (e.g. a prior `regression_test_suite_plan.md`) →
  `implementation/plans/`

If a document doesn't have an obvious home yet, put it in `knowledge/doc/_inbox/` — the AI
agent's job on first run includes triaging `_inbox/` into the right place.

### Step 3 — Run the bootstrap script

Run the script in [Section 11](#11-bootstrapsh) (extract it from this file, or ask the AI agent
to run it verbatim). It creates the full directory tree, root files, and all three automation
sub-projects (Playwright, Appium, Maestro) with working dependency manifests and config files,
so `npm install` succeeds immediately — even before a single test scenario is written.

```bash
# from an empty repo root, with this file present:
bash <(sed -n '/^```bash:bootstrap.sh$/,/^```$/p' qa_automation_project_scaffold.md | sed '1d;$d')
```

(Section 11 also gives the script as a plain file you can save as `bootstrap.sh` and run
directly — that's the more robust option; the one-liner above is a convenience for agents that
can only operate on this single file.)

### Step 4 — Hand off to the AI agent for scenario/script generation

Give the AI agent the prompt in [Section 1](#1-ai-agent-bootstrap-prompt). It reads
`knowledge/`, cross-references `implementation/plans/`, discovers what automation already
exists under `source/projects/`, and only creates what is missing — per the reuse-first
workflow in [Section 13](#13-ai-driven-qa-workflow-mapped-to-this-repo). Every generation pass
must append an entry to `implementation/ai_usages/ai_utilization_log.md` explaining what was
reused, what was created, and why — that log is the audit trail in place of a separate
knowledge-transfer document.

### Step 5 — Review, install, run, report

A human QA reviewer approves generated/updated scripts (AI drafts, humans gate — see
[Section 16](#16-governance--timecost-control)). Then:

```bash
npm run setup                # installs all three engines' dependencies + browsers/CLIs
npm run test:web             # Playwright
npm run test:mobile:appium   # Appium (Android or iOS profile)
npm run test:mobile:maestro  # Maestro
npm run report:allure        # merges all three result sets into one Allure report
```

### Step 6 — Keep it living

On every new CR/release: drop the new release notes into `knowledge/release_notes/`, re-run
the AI agent with the prompt in Section 1, let it map the change to affected flows, reuse what
exists, create only genuine gaps, and update `implementation/plans/scenario-catalog.md` and
`summary.md` / `task_log.md` at the repo root. The suite should grow in *value*, not
proportionally in *maintenance effort*.

---

<a id="1-ai-agent-bootstrap-prompt"></a>
## 1. AI Agent Bootstrap Prompt (copy-paste)

Paste this to an AI coding agent that has access to the repository (with this file and any
documents already placed per Step 2 above):

```
You are bootstrapping / extending a QA automation repository using
qa_automation_project_scaffold.md as the authoritative spec. Do the following, in order:

1. If the folder contract in Section 2 of the scaffold file does not exist yet, run the
   bootstrap script in Section 11 verbatim to create it.
2. Read every document under knowledge/doc/ and knowledge/release_notes/. Triage anything in
   knowledge/doc/_inbox/ into the right subfolder.
3. Identify Base Flows and Sub Flows from those documents (see Section 13 — AI-Driven QA
   Workflow). Cross-reference implementation/plans/ for any existing plan or scenario catalog.
4. Scan source/projects/playwright, source/projects/appium, source/projects/maestro for
   automation that already covers those flows. Reuse it — do not regenerate what exists and
   already passes.
5. For genuine coverage gaps only, create:
   - Playwright specs under source/projects/playwright/tests/ (+ page objects under pages/)
   - Appium page objects + specs under source/projects/appium/pageobjects/ and /specs/
   - Maestro flows under source/projects/maestro/flows/ (+ subflows/)
   Each new scenario gets a unique Scenario ID (see Section 14) recorded in
   implementation/plans/scenario-catalog.md, with the engine(s) and script path(s) it maps to.
6. Do not fabricate assertions or placeholder "always pass" checks — every scenario must assert
   real, observable application behaviour (see the "assert nothing" failure mode called out in
   Section 15 — this is a hard requirement, not a style preference).
7. Append a dated entry to implementation/ai_usages/ai_utilization_log.md describing: what was
   reused, what was newly created, what gaps were skipped and why, and any assumptions made.
8. Update root summary.md and task_log.md with what changed in this pass.
9. Stop and hand back to a human reviewer — do not execute against production systems or merge
   without explicit approval (Section 16).
```

---

<a id="2-canonical-folder-contract"></a>
## 2. Canonical Folder Contract

This exact shape is the contract every future generation pass must preserve:

```
<repo-root>/
├── qa_automation_project_scaffold.md      # this file — stays at root, never deleted
├── summary.md                             # living project summary
├── task_log.md                            # chronological task/change log
├── package.json                           # root orchestrator (workspaces + npm scripts)
├── .gitignore
├── .env.example
│
├── implementation/
│   ├── plans/                             # planning docs, regression plans, scenario catalog
│   │   ├── scenario-catalog.md
│   │   └── regression-matrix.md
│   └── ai_usages/                         # AI utilization / audit log
│       └── ai_utilization_log.md
│
├── knowledge/
│   ├── doc/                               # PRD, BRD, architecture, business rules
│   │   └── _inbox/                        # untriaged tester-provided docs land here first
│   └── release_notes/                     # per-release notes / changelogs / dev summaries
│
├── source/
│   └── projects/
│       ├── playwright/                    # Web E2E (TypeScript)
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   ├── playwright.config.ts
│       │   ├── tests/
│       │   ├── pages/                     # Page Object Models
│       │   ├── fixtures/
│       │   └── utils/
│       │
│       ├── maestro/                       # Mobile — declarative YAML flows
│       │   ├── config.yaml
│       │   ├── subflows/
│       │   ├── flows/
│       │   └── run_maestro_suite.sh
│       │
│       └── appium/                        # Mobile — programmatic WebdriverIO + TypeScript
│           ├── package.json
│           ├── tsconfig.json
│           ├── wdio.conf.ts
│           ├── wdio.android.conf.ts
│           ├── wdio.ios.conf.ts
│           ├── config/
│           │   └── testdata.json
│           ├── pageobjects/
│           ├── specs/
│           └── utils/
│
├── reports/
│   ├── results/                           # raw per-engine result output (allure-results / junit)
│   │   ├── playwright/
│   │   ├── appium/
│   │   └── maestro/
│   ├── reports/                           # rendered human-readable summaries (non-Allure)
│   └── allure-report/                     # generated static Allure HTML site (gitignored)
│
└── executions/
    └── logs/                              # timestamped raw execution logs per run
```

Naming note: the user-facing mobile-declarative engine is **Maestro** (the repo folder is
`source/projects/maestro/` — "mastro" in casual references is the same folder).

---

<a id="3-root-level-files"></a>
## 3. Root-Level Files

### `summary.md` template

```markdown
# Project Summary

**Product:** <name>
**Repo:** <this repo>
**QA Model:** Script-first, AI-assisted (build once → store → execute → reuse → improve)
**Engines:** Playwright (web) · Appium (mobile, programmatic) · Maestro (mobile, declarative)
**Reporting:** Allure (merged across all three engines)

## Current Coverage Snapshot
| Domain | Web (Playwright) | Mobile (Appium) | Mobile (Maestro) | Status |
|---|---|---|---|---|
| <domain> | <spec path or —> | <spec path or —> | <flow path or —> | <Covered/Partial/Gap> |

## Open Gaps
- <gap and reason — e.g. "needs seeded data", "no testID yet">

## Last Updated
<date> — by <human/AI pass>
```

### `task_log.md` template

```markdown
# Task Log

Chronological, one entry per meaningful change. Newest first.

## <YYYY-MM-DD> — <short title>
- **Trigger:** <CR / release / defect / manual request>
- **Docs consulted:** <knowledge/... paths>
- **Reused:** <existing scripts reused>
- **Created:** <new scripts, with Scenario IDs>
- **Skipped/Deferred:** <gaps not covered, with reason>
- **Result:** <pass/fail summary, link to reports/allure-report>
```

---

<a id="4-implementation"></a>
## 4. `implementation/` — Plans & AI Usage Audit Trail

- **`plans/`** — every planning artifact: the master regression plan, the scenario catalog
  (`scenario-catalog.md`, one row per Scenario ID → engine → script path → status), and the
  traceability matrix (`regression-matrix.md`, Scenario ID → requirement/defect it traces to).
  If you already have a prior plan document (e.g. a previous `regression_test_suite_plan.md`),
  drop it here as-is — the AI agent treats it as an input, not something to overwrite blindly.
- **`ai_usages/`** — `ai_utilization_log.md` is the audit trail: every AI generation/update
  pass appends a dated entry recording what it reused vs. created and why a scenario was
  selected, skipped, or reclassified (this is the "AI recommendations must be explainable"
  requirement — it replaces a separate knowledge-transfer document).

`ai_utilization_log.md` entry template:

```markdown
## <YYYY-MM-DD HH:MM> — <trigger, e.g. "CR-142 release notes">
- Docs read: <paths under knowledge/>
- Base/Sub Flows impacted: <list>
- Reused scripts: <paths>
- New scripts created: <paths + Scenario IDs>
- Gaps explicitly skipped: <what + why>
- Assumptions made: <list>
```

---

<a id="5-knowledge"></a>
## 5. `knowledge/` — Source of Truth Documents

- **`doc/`** — PRDs, BRDs, architecture notes, business rules, API specs. This is what the AI
  agent reads first to derive Base Flows and Sub Flows (Section 13, step 2).
- **`doc/_inbox/`** — landing zone for anything the tester hands over that hasn't been sorted
  yet. The AI agent's first job on any bootstrap/update pass is to triage this folder.
- **`release_notes/`** — one file per release/CR (e.g. `2026-09-08-v1.4.0.md`). These drive
  the "what changed → what needs regression" mapping in Section 13.

Nothing under `knowledge/` is ever modified by test runs — it is input, not output.

---

<a id="6-sourceprojects"></a>
## 6. `source/projects/` — Automation Engines

### Playwright (`playwright/`) — Web

Standard Playwright Test layout: `tests/` for specs, `pages/` for Page Object Models,
`fixtures/` for custom fixtures (auth state, seeded data), `utils/` for API helpers and
shared assertions. Results are written to `reports/results/playwright/` in native
allure-results JSON via `allure-playwright`.

### Maestro (`maestro/`) — Mobile, declarative

`config.yaml` holds the app ID and global timeouts. `subflows/` holds reusable steps (login,
navigate-to-group, clear-app-state, reset-state) referenced with `runFlow:`. `flows/` holds one
YAML per domain/journey. `run_maestro_suite.sh` executes every flow, emits JUnit XML into
`reports/results/maestro/`, and prints a pass/fail summary.

### Appium (`appium/`) — Mobile, programmatic

WebdriverIO + TypeScript. `pageobjects/` for Page Object Models (a `BasePage` plus one per
screen), `specs/` for Mocha specs with real assertions, `utils/` for `ApiHelper` (REST seeding
and teardown against the real backend), `DbHelper` if direct DB verification is needed, and the
Allure reporter is wired in `wdio.conf.ts`. Android and iOS get their own capability files
(`wdio.android.conf.ts`, `wdio.ios.conf.ts`) so the same specs run unmodified on both.

**Selector policy (important):** do not guess selectors against copy that "should" exist in
the app. Prefer stable `testID` / accessibility-id selectors where the app exposes them; where
it doesn't, derive selectors from the app's actual source (screen inventory/fingerprint
approach) rather than hand-guessed regexes, and keep an inventory-drift check in CI. Guessed
text selectors are the single biggest cause of a suite that "looks complete" but cannot pass.

---

<a id="7-reports"></a>
## 7. `reports/` — Results & Allure

- **`results/`** — raw output per engine, one subfolder each, so nothing overwrites another
  engine's results: `results/playwright/` (allure-results JSON from `allure-playwright`),
  `results/appium/` (allure-results JSON from `@wdio/allure-reporter`), `results/maestro/`
  (JUnit XML — Allure2 ships a JUnit-XML plugin that ingests `<testsuite>` XML directly, so
  Maestro's native JUnit output can sit alongside the other two engines' allure-results without
  a conversion step).
- **`reports/`** — lightweight human-readable run summaries that aren't Allure (e.g. the
  Markdown run report Appium's `TestReporter` util writes, or Maestro's shell summary).
- **`allure-report/`** — the generated static Allure site, produced by
  `allure generate reports/results/playwright reports/results/appium reports/results/maestro -o reports/allure-report --clean`.
  Gitignored — it's a build artifact, regenerated every run.

---

<a id="8-executions"></a>
## 8. `executions/` — Run Logs

`executions/logs/` holds one timestamped raw log file per run per engine
(`2026-09-08T14-30-00_playwright.log`, etc.) — full stdout/stderr, kept separately from the
structured Allure results so a failing run can be debugged without re-running.

---

<a id="9-dependency-manifests"></a>
## 9. Dependency Manifests (full file contents)

### Root `package.json`

```json
{
  "name": "qa-automation-suite",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "source/projects/playwright",
    "source/projects/appium"
  ],
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
  "devDependencies": {
    "allure-commandline": "^2.30.0"
  }
}
```

### `source/projects/playwright/package.json`

```json
{
  "name": "qa-playwright",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "install:browsers": "playwright install --with-deps",
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "allure-playwright": "^3.0.0",
    "typescript": "^5.5.0",
    "dotenv": "^16.4.5",
    "@types/node": "^20.14.0"
  }
}
```

### `source/projects/appium/package.json`

```json
{
  "name": "qa-appium",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc --noEmit",
    "test": "wdio run wdio.conf.ts",
    "test:android": "wdio run wdio.android.conf.ts",
    "test:ios": "wdio run wdio.ios.conf.ts"
  },
  "devDependencies": {
    "@wdio/cli": "^9.4.0",
    "@wdio/local-runner": "^9.4.0",
    "@wdio/mocha-framework": "^9.4.0",
    "@wdio/appium-service": "^9.4.0",
    "@wdio/allure-reporter": "^9.4.0",
    "@wdio/spec-reporter": "^9.4.0",
    "appium": "^2.11.0",
    "appium-uiautomator2-driver": "^3.7.0",
    "appium-xcuitest-driver": "^7.30.0",
    "typescript": "^5.5.0",
    "ts-node": "^10.9.2",
    "@types/node": "^20.14.0",
    "@types/mocha": "^10.0.7",
    "dotenv": "^16.4.5"
  }
}
```

Maestro has no `package.json` — it is a standalone CLI installed via `install_maestro.sh`
(Section 10).

---

<a id="10-config-scaffolds"></a>
## 10. Config Scaffolds (full file contents)

### `.env.example` (root)

```bash
# Web
WEB_BASE_URL=https://staging.example.com

# API (used by ApiHelper for seeding/teardown across all engines)
API_BASE_URL=https://staging-api.example.com/api/v1

# Mobile app identifiers
ANDROID_APP_ID=com.example.app
IOS_BUNDLE_ID=com.example.app
ANDROID_APP_PATH=./builds/app-debug.apk
IOS_APP_PATH=./builds/App.app

# Device targets
ANDROID_DEVICE_NAME=Pixel_8_Pro_API_35
IOS_DEVICE_NAME=iPhone 16 Pro

# Seeded test credentials (never real user data)
TEST_USER_PHONE=0000000000
TEST_USER_OTP=123456
```

### `.gitignore` (root)

```gitignore
node_modules/
reports/allure-report/
reports/results/**/*
!reports/results/**/.gitkeep
executions/logs/*
!executions/logs/.gitkeep
.env
dist/
*.log
.DS_Store
```

### `source/projects/playwright/playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: '../../../reports/results/playwright' }],
    ['html', { outputFolder: '../../../reports/reports/playwright-html', open: 'never' }],
  ],
  use: {
    baseURL: process.env.WEB_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### `source/projects/playwright/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["tests/**/*.ts", "pages/**/*.ts", "fixtures/**/*.ts", "utils/**/*.ts"]
}
```

### `source/projects/maestro/config.yaml`

```yaml
appId: ${ANDROID_APP_ID}
env:
  API_BASE_URL: ${API_BASE_URL}
```

### `source/projects/maestro/install_maestro.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
if ! command -v maestro >/dev/null 2>&1; then
  echo "Installing Maestro CLI..."
  curl -Ls "https://get.maestro.mobile.dev" | bash
  export PATH="$PATH:$HOME/.maestro/bin"
fi
maestro --version
```

### `source/projects/maestro/run_maestro_suite.sh`

```bash
#!/usr/bin/env bash
set -uo pipefail
RESULTS_DIR="../../../reports/results/maestro"
LOG_DIR="../../../executions/logs"
mkdir -p "$RESULTS_DIR" "$LOG_DIR"

TS=$(date +%Y%m%dT%H%M%S)
LOG_FILE="$LOG_DIR/${TS}_maestro.log"

echo "Running Maestro flows..." | tee "$LOG_FILE"
maestro test flows/ \
  --format junit \
  --output "$RESULTS_DIR/maestro-results.xml" \
  2>&1 | tee -a "$LOG_FILE"

STATUS=$?
echo "Maestro run finished with exit code $STATUS" | tee -a "$LOG_FILE"
exit $STATUS
```

### `source/projects/appium/wdio.conf.ts` (base, extended by android/ios configs)

```ts
import type { Options } from '@wdio/types';
import 'dotenv/config';

export const config: Options.Testrunner = {
  runner: 'local',
  specs: ['./specs/**/*.spec.ts'],
  maxInstances: 1,
  logLevel: 'info',
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 120000 },
  reporters: [
    'spec',
    ['allure', {
      outputDir: '../../../reports/results/appium',
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }],
  ],
  services: ['appium'],
  afterTest: async function (test, context, { error, passed }) {
    if (!passed) {
      await browser.saveScreenshot(
        `../../../reports/results/appium/failure-${test.title.replace(/\s+/g, '_')}.png`
      );
    }
  },
};
```

### `source/projects/appium/wdio.android.conf.ts`

```ts
import { config as baseConfig } from './wdio.conf';
import 'dotenv/config';

export const config = {
  ...baseConfig,
  port: 4723,
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME,
    'appium:app': process.env.ANDROID_APP_PATH,
    'appium:autoGrantPermissions': true,
  }],
};
```

### `source/projects/appium/wdio.ios.conf.ts`

```ts
import { config as baseConfig } from './wdio.conf';
import 'dotenv/config';

export const config = {
  ...baseConfig,
  port: 4723,
  capabilities: [{
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:deviceName': process.env.IOS_DEVICE_NAME,
    'appium:app': process.env.IOS_APP_PATH,
  }],
};
```

### `source/projects/appium/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "mocha", "@wdio/globals/types"]
  },
  "include": ["pageobjects/**/*.ts", "specs/**/*.ts", "utils/**/*.ts", "*.ts"]
}
```

---

<a id="11-bootstrapsh"></a>
## 11. `bootstrap.sh` — One-Shot Scaffolding Script

Save the block below as `bootstrap.sh` at the repo root (next to this file) and run
`bash bootstrap.sh`. It creates every directory in the folder contract, writes root files,
writes both `package.json`s, both TS configs, both Playwright/Appium configs, the Maestro
config + scripts, placeholder `.gitkeep` files, a starter smoke test per engine, and marks the
shell scripts executable. It is idempotent — safe to re-run.

> **Local note (Flexcap_Automation):** the repo-root `bootstrap.sh` is a corrected,
> Windows-compatible version of the script below. See `task_log.md` (initial scaffold entry) for
> the list of deviations. The original is kept here unchanged as the reference spec.

```bash:bootstrap.sh
#!/usr/bin/env bash
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
mkdir -p executions/logs
touch reports/results/playwright/.gitkeep reports/results/appium/.gitkeep \
      reports/results/maestro/.gitkeep executions/logs/.gitkeep

# --- root files ----------------------------------------------------------
[ -f summary.md ] || cat > summary.md <<'EOF'
# Project Summary

**QA Model:** Script-first, AI-assisted (build once → store → execute → reuse → improve)
**Engines:** Playwright (web) · Appium (mobile) · Maestro (mobile)
**Reporting:** Allure

## Current Coverage Snapshot
| Domain | Web (Playwright) | Mobile (Appium) | Mobile (Maestro) | Status |
|---|---|---|---|---|

## Open Gaps

## Last Updated
_(update on every AI/human pass)_
EOF

[ -f task_log.md ] || cat > task_log.md <<'EOF'
# Task Log

## $(date +%Y-%m-%d) — Initial scaffold
- Bootstrapped folder contract via bootstrap.sh
EOF

[ -f .env.example ] || cat > .env.example <<'EOF'
WEB_BASE_URL=https://staging.example.com
API_BASE_URL=https://staging-api.example.com/api/v1
ANDROID_APP_ID=com.example.app
IOS_BUNDLE_ID=com.example.app
ANDROID_APP_PATH=./builds/app-debug.apk
IOS_APP_PATH=./builds/App.app
ANDROID_DEVICE_NAME=Pixel_8_Pro_API_35
IOS_DEVICE_NAME=iPhone 16 Pro
TEST_USER_PHONE=0000000000
TEST_USER_OTP=123456
EOF

[ -f .gitignore ] || cat > .gitignore <<'EOF'
node_modules/
reports/allure-report/
reports/results/**/*
!reports/results/**/.gitkeep
executions/logs/*
!executions/logs/.gitkeep
.env
dist/
*.log
.DS_Store
EOF

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

[ -f implementation/ai_usages/ai_utilization_log.md ] || cat > implementation/ai_usages/ai_utilization_log.md <<'EOF'
# AI Utilization Log

One entry per AI-assisted generation/update pass.
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
    "install:browsers": "playwright install --with-deps",
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "report": "playwright show-report"
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
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: '../../../reports/results/playwright' }],
    ['html', { outputFolder: '../../../reports/reports/playwright-html', open: 'never' }],
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
  "include": ["tests/**/*.ts", "pages/**/*.ts", "fixtures/**/*.ts", "utils/**/*.ts"]
}
EOF

[ -f source/projects/playwright/tests/smoke.spec.ts ] || cat > source/projects/playwright/tests/smoke.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('smoke: home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});
EOF

# --- maestro ---------------------------------------------------------------
[ -f source/projects/maestro/config.yaml ] || cat > source/projects/maestro/config.yaml <<'EOF'
appId: ${ANDROID_APP_ID}
env:
  API_BASE_URL: ${API_BASE_URL}
EOF

[ -f source/projects/maestro/install_maestro.sh ] || cat > source/projects/maestro/install_maestro.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
if ! command -v maestro >/dev/null 2>&1; then
  echo "Installing Maestro CLI..."
  curl -Ls "https://get.maestro.mobile.dev" | bash
  export PATH="$PATH:$HOME/.maestro/bin"
fi
maestro --version
EOF

[ -f source/projects/maestro/run_maestro_suite.sh ] || cat > source/projects/maestro/run_maestro_suite.sh <<'EOF'
#!/usr/bin/env bash
set -uo pipefail
RESULTS_DIR="../../../reports/results/maestro"
LOG_DIR="../../../executions/logs"
mkdir -p "$RESULTS_DIR" "$LOG_DIR"
TS=$(date +%Y%m%dT%H%M%S)
LOG_FILE="$LOG_DIR/${TS}_maestro.log"
echo "Running Maestro flows..." | tee "$LOG_FILE"
maestro test flows/ --format junit --output "$RESULTS_DIR/maestro-results.xml" 2>&1 | tee -a "$LOG_FILE"
STATUS=$?
echo "Maestro run finished with exit code $STATUS" | tee -a "$LOG_FILE"
exit $STATUS
EOF
chmod +x source/projects/maestro/install_maestro.sh source/projects/maestro/run_maestro_suite.sh

[ -f source/projects/maestro/flows/00_smoke.yaml ] || cat > source/projects/maestro/flows/00_smoke.yaml <<'EOF'
appId: ${ANDROID_APP_ID}
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
    "test": "wdio run wdio.conf.ts",
    "test:android": "wdio run wdio.android.conf.ts",
    "test:ios": "wdio run wdio.ios.conf.ts"
  },
  "devDependencies": {
    "@wdio/cli": "^9.4.0",
    "@wdio/local-runner": "^9.4.0",
    "@wdio/mocha-framework": "^9.4.0",
    "@wdio/appium-service": "^9.4.0",
    "@wdio/allure-reporter": "^9.4.0",
    "@wdio/spec-reporter": "^9.4.0",
    "appium": "^2.11.0",
    "appium-uiautomator2-driver": "^3.7.0",
    "appium-xcuitest-driver": "^7.30.0",
    "typescript": "^5.5.0",
    "ts-node": "^10.9.2",
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
    "esModuleInterop": true, "skipLibCheck": true,
    "types": ["node", "mocha", "@wdio/globals/types"]
  },
  "include": ["pageobjects/**/*.ts", "specs/**/*.ts", "utils/**/*.ts", "*.ts"]
}
EOF

[ -f source/projects/appium/wdio.conf.ts ] || cat > source/projects/appium/wdio.conf.ts <<'EOF'
import type { Options } from '@wdio/types';
import 'dotenv/config';

export const config: Options.Testrunner = {
  runner: 'local',
  specs: ['./specs/**/*.spec.ts'],
  maxInstances: 1,
  logLevel: 'info',
  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 120000 },
  reporters: [
    'spec',
    ['allure', {
      outputDir: '../../../reports/results/appium',
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }],
  ],
  services: ['appium'],
};
EOF

[ -f source/projects/appium/wdio.android.conf.ts ] || cat > source/projects/appium/wdio.android.conf.ts <<'EOF'
import { config as baseConfig } from './wdio.conf';
import 'dotenv/config';

export const config = {
  ...baseConfig,
  port: 4723,
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME,
    'appium:app': process.env.ANDROID_APP_PATH,
    'appium:autoGrantPermissions': true,
  }],
};
EOF

[ -f source/projects/appium/wdio.ios.conf.ts ] || cat > source/projects/appium/wdio.ios.conf.ts <<'EOF'
import { config as baseConfig } from './wdio.conf';
import 'dotenv/config';

export const config = {
  ...baseConfig,
  port: 4723,
  capabilities: [{
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:deviceName': process.env.IOS_DEVICE_NAME,
    'appium:app': process.env.IOS_APP_PATH,
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
  it('app launches', async () => {
    const source = await driver.getPageSource();
    expect(source.length).toBeGreaterThan(0);
  });
});
EOF

echo "Scaffold complete. Next: npm run setup"
```

---

<a id="12-execution-commands-cheat-sheet"></a>
## 12. Execution Commands Cheat Sheet

```bash
# One-time setup — installs Node deps for Playwright/Appium (via workspaces),
# Playwright browsers, and the Maestro CLI
npm run setup

# Web
npm run test:web                          # Playwright, headless
npm --workspace source/projects/playwright run test:headed
npm --workspace source/projects/playwright run report   # open Playwright's own HTML report

# Mobile — Appium
npm run test:mobile:appium:android
npm run test:mobile:appium:ios
npm --workspace source/projects/appium run build         # tsc --noEmit, verify no type errors

# Mobile — Maestro
npm run test:mobile:maestro
# or directly, with an ad-hoc filter:
cd source/projects/maestro && maestro test flows/05_polls_wizard_override.yaml

# Everything (web + Appium/Android + Maestro)
npm run test:all

# Reporting — merge all three result sets into one Allure site
npm run report:allure
npm run report:allure:open

# Backend/compile sanity checks (if this repo sits alongside app source)
JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn -f ../backend clean compile
JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn -f ../backend test
```

---

<a id="13-ai-driven-qa-workflow-mapped-to-this-repo"></a>
## 13. AI-Driven QA Workflow Mapped to This Repo

The end-to-end flow, and exactly which folder each step reads from / writes to:

1. **Input** — PRD / BRD / Release Notes / Dev Summary land in `knowledge/doc/` and
   `knowledge/release_notes/` (Step 2 of the instruction manual).
2. **AI identifies Base Flows and Sub Flows** from those documents.
3. **AI understands requirements and change impact**, reading `implementation/plans/` for
   what's already known.
4. **AI discovers existing scenarios and scripts** by scanning `source/projects/playwright`,
   `source/projects/appium`, `source/projects/maestro` and cross-referencing
   `implementation/plans/scenario-catalog.md`.
5. **AI identifies coverage gaps** — flows with no matching Scenario ID, or a Scenario ID whose
   script no longer matches current app behaviour.
6. **AI creates only required new scenarios/scripts** — one Scenario ID = one automation asset,
   written to the appropriate engine folder(s) under `source/projects/`.
7. **QA reviews and approves** the diff (new/changed files under `source/projects/` and
   `implementation/plans/`) before it's trusted for regression.
8. **Saved scripts are executed** via the commands in Section 12.
9. **Results, screenshots and logs are stored** — structured results to `reports/results/`,
   readable summaries to `reports/reports/`, raw logs to `executions/logs/`.
10. **Scenario status is updated automatically** — pass/fail/blocked/not-executed reflected back
    into `implementation/plans/scenario-catalog.md` and the merged Allure report.
11. **AI updates impacted regression coverage** and appends the pass to
    `implementation/ai_usages/ai_utilization_log.md` and root `task_log.md` / `summary.md`.

This is the same "build once → store → execute → reuse → improve" loop, with every step given
a fixed, discoverable home so an AI agent's second pass never has to guess where something
lives.

---

<a id="14-scenario-design--coverage-rules"></a>
## 14. Scenario Design & Coverage Rules

- **One Scenario ID = one reusable automation asset.** Format: `<DOMAIN>-<NNN>`, e.g.
  `AUTH-003`, `GOLF-014`. Registered once in `implementation/plans/scenario-catalog.md` with
  its engine(s) and script path(s), then reused across CRs/releases — never re-created.
- **Engine assignment:** Web → Playwright. Mobile → Appium for programmatic/parameterized/
  data-validation scenarios; Maestro for fast declarative smoke/critical-path journeys. A
  scenario may legitimately have both an Appium spec and a Maestro flow (deep check vs.
  fast check) — the catalog records both paths.
- **Coverage classification per scenario, where relevant:** Positive, Negative, Edge/Boundary,
  State, Role, Integration, Data, Recovery. Duplicate or low-value scenarios are not created —
  the goal is complete *relevant* coverage, not test-case volume.
- **Selectors must be real.** No selector may be guessed against copy that "should" exist —
  derive selectors from the app's actual source/build (testID where present; otherwise a
  generated screen/element inventory checked for drift in CI). A scenario whose selector cannot
  be verified against real app source is not created — it's logged as a gap instead.
- **Every scenario asserts real, observable behaviour.** A scenario that logs a step without a
  backing assertion is not valid coverage and must not be reported as passing.
- **Not every screen is reachable without seeded data** (e.g. a scoring screen needing a drawn
  match, a cancellation-lockdown screen needing a cancelled event). Such specs `skip` with a
  stated reason rather than silently passing or being omitted — the gap is always visible.

---

<a id="15-evidence-reporting--failure-classification"></a>
## 15. Evidence, Reporting & Failure Classification

- Screenshots are captured against the specific scenario + execution/version and stored under
  `reports/results/<engine>/`; Allure attaches them to the relevant test automatically for
  Playwright and Appium (WDIO's `afterTest` hook), and Maestro's own screenshot commands feed
  the same folder.
- Failure evidence always includes: screenshot, log excerpt (from `executions/logs/`), and
  expected vs. actual result — never a bare "failed" status with nothing to diagnose from.
- Every failure is classified as one of: **Product Defect**, **Automation Issue**,
  **Environment Issue**, or **Test Data Issue** — recorded in the run's entry in
  `reports/reports/` and reflected in `task_log.md`.
- Execution results (the Allure site under `reports/allure-report/`) are what gets shared for
  audit — never hand-summarized numbers with no underlying evidence trail.

---

<a id="16-governance--timecost-control"></a>
## 16. Governance & Time/Cost Control

- **Human QA is the quality gate.** AI drafts scenarios/scripts and explains its reasoning
  (via `implementation/ai_usages/ai_utilization_log.md`); a human reviews and approves before
  anything is trusted for regression or merged.
- **Normal regression runs saved scripts directly** — AI is not invoked to regenerate tests on
  every run, only for new-CR analysis, coverage-gap detection, script creation/maintenance,
  failure analysis, and regression updates (Section 13).
- **Reuse before creating.** Promote valuable one-off scenarios into the reusable regression
  set; remove redundant or low-value coverage when identified, so the suite's *maintenance*
  effort doesn't grow proportionally to its *value*.
- **Time budget guides selection** so the highest-risk coverage runs first; target normal
  release execution within roughly the time budget the team sets, where automation and
  environment allow (e.g. ~30 minutes for a standard release regression).
- **Traceability is end-to-end:** requirement/release-note → Base/Sub Flow → Scenario ID →
  script (`source/projects/...`) → evidence (`reports/results/...`) → result (Allure). Anyone
  should be able to walk that chain in either direction from `implementation/plans/regression-matrix.md`.

---

*This file merges the AI-Driven QA Execution Model process with a dual-engine mobile strategy
(Maestro + Appium) and Playwright for web, under one fixed folder contract with Allure
reporting. Keep it at the repo root; every generation/update pass should re-read it before
touching `source/projects/`.*
