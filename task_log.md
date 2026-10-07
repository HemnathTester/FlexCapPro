# Task Log

Dated, chronological. Newest at the bottom. Record what was generated, what is open, what broke and how
it was fixed, and every processed change request.

## 2026-10-05
- Project reset; skeleton recreated from RULES.md §1 (folders, summary.md, task_log.md,
  TEST_CASE_GENERATION_TEMPLATE.md, scenario-catalog.md, coverage-model.md, ai_utilization_log.md).
- Open: platform/product choice, requirement docs, CLI.

## 2026-10-06
- Decided: fully web application. Created `source/web/chrome/` (Playwright + TypeScript), CLI at
  `source/web/chrome/cli/run.mjs`, root `npm run test -- --product=chrome --module=<module>`.
- Config: screenshot on every scenario, runs continue past failures, results to `executions/<runId>/`
  and `reports/results/chrome/<runId>/`, `executions/execution_runs.json` appended per run.
- Verified: deps install, tsc clean, CLI stops with a plain-language reason for a missing module.
- Not yet done: AI diagnosis/halt-recovery hook, triage report, no modules/specs yet.
- Open: requirement docs, app URL/credentials in `.env`, first module.

- Read PRD v1.4, BPSP flow deck and Referral flow deck in full. Proposed 12 modules (see summary.md). Gaps noted: BRD not uploaded,
  PRD says frontend source unreviewed (ASS-001), BPSP-vs-Referral assignment criteria unknown (ASS-006), 4 notification template IDs TBD,
  open decisions (single login REQ-UM-008, payment-link security ASS-008). Awaiting confirmation of module list and first module.

- Added existing manual suite (2,201 TCs, 22 tabs) to knowledge/doc/ as reference. Module list revised to 16 (summary.md): added entity-management,
  business-user-admin, dashboard, backoffice-verification as separate modules. Backoffice, reconciliation, DocuSign, admin-config have no manual TCs at all.
  Open: do not import the 2,201 TCs wholesale; RULES.md §4 targets a small high-value set per module.

## 2026-10-06 (data store)
- Built `source/web/chrome/utils/dataStore.ts` (exceljs): sheets Users, Entities, Relationships, Invoices, Payments, each with Run ID / Created By / Date / Status
  (Valid or Consumed). API: add, find, update, markConsumed. Workbook: `source/web/chrome/fixtures/created-data.xlsx` (gitignored, auto-created on first use);
  header-only `created-data.template.xlsx` committed. `--fresh` on the CLI ignores rows from earlier runs.
- Fixed: playwright.config.ts used __dirname (undefined in ESM); CLI now stops with a plain-language reason when Playwright errors or finds 0 tests instead of saying "complete".
- Verified with a temporary self-test (removed): add/find/update/consume, reuse across runs, --fresh. Scripts must close the workbook in Excel before a run.

## 2026-10-06 (user-access started)
- Owner confirmed: UAT only; edge cases required; test accounts buyer01@yopmail.com and supplier01@yopmail.com (dummy mobile numbers).
- Added 33 user-access scenarios (UA-REG-SUPPLIER-VALID-REGISTRATION..10, UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP..15, UA-FP-FULL-RESET-BY-LINK..08; 8 Positive / 6 Negative / 19 Edge) to scenario-catalog.md and
  coverage-model.md, grounded in PRD v1.4 and the Register/Login/Forgot Password tabs of the manual suite (reference only). Created module-plans/User-Access-Plan.md.
- CLI now refuses to run unless TARGET_ENV=UAT and BASE_URL is set. .env created (gitignored).
- Blocked: UAT URL, passwords (or create accounts via UA-REG), yopmail OTP-reading approach, live-screen capture, dual-role account.
- Not yet written: locator maps, User-Access-TestCases.md, User-Access-UserScenarios.md, scripts (steps must come from the live screen, RULES.md §3).

## 2026-10-06 (user-access scripted)
- Built the suite in source/web/chrome: helpers (flows, dataStore, yopmail, ask), fixtures/base (hierarchy dump on failure), CLI with ask prompts, failures-first triage report, --headed/--slowmo/--auto-mail/--fresh/--slow.
- 33 scripts (UA-REG-SUPPLIER-VALID-REGISTRATION..10, UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP..15, UA-FP-FULL-RESET-BY-LINK..08); one file per scenario ID. LOGIN-12 is @slow; LOGIN-14/15 are blocked (fixme): no dual-role account, no profile screen before onboarding.
- First Register run (before fixes): PASS 05, 07, 08; FAIL 01, 02, 03, 04, 09 (script locator bugs, fixed), 10 (mail reader), 06 (real findings: 300-char business name accepted; 20-digit phone accepted).
- Owner decision: the suite asks the person for OTPs/links instead of reading yopmail (--auto-mail to override).
- UAT facts: new accounts land on Onboarding (not Dashboard); verify link needs a button click; Forgot Password is link-based; supplier01/buyer01 were created or pre-existing (supplier01 existed, unknown password).
- Not done: full-module run, test-case docs, reset-page locators confirmed against the live page.
