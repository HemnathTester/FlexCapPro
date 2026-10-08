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
- Added 33 user-access scenarios (UA-REG-SUPPLIER-VALID-REGISTRATION..10, UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP..15, UA-FP-FULL-RESET-BY-OTP..08; 8 Positive / 6 Negative / 19 Edge) to scenario-catalog.md and
  coverage-model.md, grounded in PRD v1.4 and the Register/Login/Forgot Password tabs of the manual suite (reference only). Created module-plans/User-Access-Plan.md.
- CLI now refuses to run unless TARGET_ENV=UAT and BASE_URL is set. .env created (gitignored).
- Blocked: UAT URL, passwords (or create accounts via UA-REG), yopmail OTP-reading approach, live-screen capture, dual-role account.
- Not yet written: locator maps, User-Access-TestCases.md, User-Access-UserScenarios.md, scripts (steps must come from the live screen, RULES.md §3).

## 2026-10-06 (user-access scripted)
- Built the suite in source/web/chrome: helpers (flows, dataStore, yopmail, ask), fixtures/base (hierarchy dump on failure), CLI with ask prompts, failures-first triage report, --headed/--slowmo/--auto-mail/--fresh/--slow.
- 33 scripts (UA-REG-SUPPLIER-VALID-REGISTRATION..10, UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP..15, UA-FP-FULL-RESET-BY-OTP..08); one file per scenario ID. LOGIN-12 is @slow; LOGIN-14/15 are blocked (fixme): no dual-role account, no profile screen before onboarding.
- First Register run (before fixes): PASS 05, 07, 08; FAIL 01, 02, 03, 04, 09 (script locator bugs, fixed), 10 (mail reader), 06 (real findings: 300-char business name accepted; 20-digit phone accepted).
- Owner decision: the suite asks the person for OTPs/links instead of reading yopmail (--auto-mail to override).
- UAT facts: new accounts land on Onboarding (not Dashboard); verify link needs a button click; Forgot Password is link-based; supplier01/buyer01 were created or pre-existing (supplier01 existed, unknown password).
- Not done: full-module run, test-case docs, reset-page locators confirmed against the live page.

## 2026-10-06 (Allure)
- Added Allure reporting for every module run: allure-playwright + allure-commandline (Java 17 present). Report per run at reports/allure/<module>/<date-time>/index.html, newest copied to .../latest/ (keeps history for trends).
  Labels: module = parent suite, spec file = suite, screen = feature, type = story/tag; environment table and executor (run date/time) included. Screenshots at key moments + final screen; hierarchy dump on failure.
- New command: npm run report -- --module=<module> [--run=<date-time>]. --scenario now accepts a comma-separated list (| is split by the shell).
- Verified with two no-email scenarios (UA-LOGIN-ROUTE-GUARD-SIGNED-OUT, UA-REG-REQUIRED-FIELDS-AND-EMAIL-FORMAT): both PASSED and the report built.

## 2026-10-06 (mail policy)
- Owner decision: links are automatic, OTPs are asked. Implemented as per-kind policy in utils/flows.ts (readsAutomatically, snap(kind)); --ask-mail added; documented in the template (all modules) and the Plan.
- Fixed the mail reader's yopmail human-check problem (the check script is no longer blocked) and refresh-by-dispatch.
- Diagnosis from the owner's run: Forgot Password sends an OTP email ("Forgot Password OTP", 6 digits), not a link, although the page text says link (report as a wording bug).
  Six UA-FP scenarios still look for a link and need rewriting for the OTP flow: waiting for the owner's go-ahead.
- Mail policy changed again (owner, final): ask for EVERY OTP and for "Verify Your Email" (person clicks the button, types "done"). --auto-mail remains for unattended runs.
  Mail reader now uses its own headless browser (it returned empty inboxes when the tests ran with --headed/--slowmo).
- Prompts now open the mailbox in a visible yopmail window (utils/mailWindow.ts): the person reads the OTP / clicks Verify there. Yopmail shows a Cloudflare "Verify you are human" checkbox to automated browsers (the reason the automatic reader was unreliable); the person ticks it.
- Fixed: window launch failed with the runner's default viewport option; second mailbox now opens via the direct link yopmail.com/?<name> in the same window.
- Owner: do NOT open yopmail (the human check blocks the next step). Prompts now print an ACTION FOR YOU (open https://yopmail.com/?<mailbox> in your own browser; read the OTP / click Verify). The visible-window code stays but is opt-in (--open-mail-window).

## 2026-10-06 (user-access wrap-up before the owner's full run)
- Owner go-ahead received: rewrote the six link-based Forgot Password scenarios for the OTP flow (FULL-RESET-BY-OTP, WRONG-AND-USED-OTP-REJECTED, NEW-PASSWORD-RULES, REUSE-OLD-PASSWORD, NEW-REQUEST-INVALIDATES-OLD-OTP, CHANGE-PASSWORD-NEEDS-VALID-OTP); tightened UA-FP-RATE-LIMIT.
- Captured live: Forgot Password submit -> POST /auth/users/forgot-password 200 "If your email is registered, you will receive an OTP shortly." then the OTP boxes + Verify + "Resend OTP in 00:56" on the same panel. Change-password step not yet captured.
- Wrote User-Access-TestCases.md and User-Access-UserScenarios.md (RULES.md §3.4, §3.6).
- Findings so far (to report, not yet re-confirmed in a full run): business name of 300 chars and a 20-digit phone were accepted at Register; Forgot Password page says "link" but sends an OTP; duplicate-email response showed no visible message in one read; the OTP validity may be very short (API returned otpExpiry 59 s): confirm.
- Module 2 (business-onboarding) NOT started: RULES.md §4 finish one module first. Waiting for the owner's full-module run results.

## 2026-10-06 (business-onboarding started)
- Owner: "go to next module". Started module 2 although the owner's full user-access run is still pending (recorded as an exception to RULES.md §4).
- Read the PRD onboarding requirements, both flow decks and the manual Supplier/Buyer onboarding tabs (reference only).
- Wrote Business-Onboarding-Plan.md and 27 planned scenarios (BO-*) into scenario-catalog.md and coverage-model.md. 27 scenarios: 8 Positive, 7 Negative, 12 Edge.
- Made ID parsing module-agnostic (report, Allure labels); added saved sessions: `npm run session:supplier` / `session:buyer` -> fixtures/auth/<role>.json, helper openSession() in utils/flows.ts.
- Blocked: live capture of the wizard (needs a signed-in session), alternate-email location, status navigation (needs backoffice module).

## 2026-10-07 (sanity suite)
- Owner asked for a sanity suite: folder `flexcap_Sanity_reg_suit`, ONE spec file, one flow, same screen checks after each login, result reported and stored like the other runs. Built SAN-FLEXCAP-END-TO-END-SANITY (26 checks: Public 10, Supplier 8, Buyer 8). Exception to RULES.md §3.5, recorded in the checklist. Run: npm run sanity.
- CLI now prints the check-by-check sanity result and appends it to triage.md; Allure report goes to reports/allure/flexcap_Sanity_reg_suit/.
- First run (2026-10-07): 8 pass, 1 FAIL, 17 SKIP. FAIL = UAT backend down: the middleware returns HTTP 502 for every call (curl confirmed; portal and Backoffice pages themselves return 200). Login/registration cannot be tested until it is back.
- Script flaw found and fixed while building: the check logged in twice in a row (verify the account, then the real login), which can trip the OTP resend cooldown; the sanity no longer logs in outside the checks.
- Observation to report: the Backoffice login page shows a "Select Email" list of staff emails (superadmintest@, backofficeadmin@, bokycadmin@ ...). Fine for UAT, a problem if it ever reaches production.
- Owner CONFIRMED (2026-10-07) the one-spec-file exception to RULES.md §3.5 for flexcap_Sanity_reg_suit only.

## 2026-10-08 (Excel report, teammate setup)
- Owner asked for an Excel report for every module run: status PASS/FAIL per test case, bug list, a screenshot for EVERY step, previous runs included. The "header" was taken from the manual regression workbook (Test Case ID | Screen | Test Case Description | Test Case Type | Priority | Test Steps | Test Data | Expected Result | Actual Result | Status | Remarks): confirm or correct.
- Built fixtures/stepRecorder.ts (screenshot after every open/click/type/press/tick/choose/upload on the scenario's page, passwords and OTPs masked) and cli/excel.mjs (sheets: Summary, Test Cases, Steps & Screenshots, Bug List, Run History, Sanity Checks). Bug IDs and run history are kept in reports/excel/<module>/bugs.json and history.json.
- Commands: npm run excel -- --module=<m> opens the newest report. Flags: --no-excel, --no-step-shots.
- Verified on two real runs (sanity: 39 steps, 39 screenshots; user-access: 54 steps, 54 screenshots). Documented steps/data/expected come from implementation/plans/testcases/*-TestCases.md.
- UAT backend is answering again (sanity 2026-10-08: public checks and both "password accepted, OTP step shown" checks passed; the two OTP checks failed only because the run had no terminal to ask for the OTP).
- Added SETUP.md (clone and run steps for a teammate); install:all now only runs npm install (Chrome and Java must already be installed).
- Owner supplied the Excel header (S.No, Test Case ID, Module, Test Scenario, Test Steps, Expected Result, Actual Result, Status, Issue Type, Issue Description, Failed API, Defect ID, Severity, Screenshot, Executed On, Duration, Priority, Scenario Type, Technical Details (QA), Run ID) and the rule that the file name is module + date + time, in a folder "excel report".
  Rebuilt cli/excel.mjs: sheet "Test Execution" uses exactly that header; files go to reports/excel_report/<module>/<module>_<date>_<time>.xlsx (evidence beside it). The recorder now also captures failing API calls for "Failed API". Issue Type / Severity are auto-classified (to be confirmed by QA). Removed the earlier test-only reports/excel folder.

## 2026-10-08 (static OTP, project-wide)
- Owner: dev team fixed the UAT login/Forgot-Password OTP to a static test value (000000) and asked that the suite bypass the OTP flow entirely for every module, now and in future. Confirmed with the owner that "Verify Your Email" is unaffected (still the real emailed link; no bypass endpoint exists for it).
- Added STATIC_OTP (default 000000, overridable via .env) and WRONG_OTP (guaranteed different value, for deliberately-wrong-OTP scenarios) to utils/flows.ts. getMail() now resolves any OTP request instantly to STATIC_OTP with zero mailbox interaction; forgotOtp() does the same. Verify-email path in getMail/askToVerify/verifyFromMail is untouched.
- Replaced every hardcoded '000000' used as a deliberately-wrong OTP with WRONG_OTP (UA-LOGIN-WRONG-OTP-REJECTED, UA-LOGIN-LOCKOUT-AFTER-WRONG-OTPS, UA-FP-WRONG-AND-USED-OTP-REJECTED, UA-FP-CHANGE-PASSWORD-NEEDS-VALID-OTP), since 000000 is now the valid code.
- Retired to test.fixme (premise no longer holds under a static OTP, pending dev-team confirmation of single-use/expiry semantics): UA-LOGIN-EXPIRED-OTP-REJECTED, UA-FP-NEW-REQUEST-INVALIDATES-OLD-OTP.
- Adjusted UA-LOGIN-OTP-INPUT-AND-RESEND-RULES (resend no longer asserted to change the code; now asserts the fixed OTP still logs in after resend) and UA-FP-WRONG-AND-USED-OTP-REJECTED step 3 (reuse-after-new-request is now reported via console.log, not hard-asserted, since old==new by construction).
- Verified: tsc clean, 36 tests still discovered (2 as fixme), and a live run of UA-LOGIN-LOCKOUT-AFTER-WRONG-OTPS proved no OTP prompt occurs (it failed only at the still-unchanged "Verify Your Email" prompt, as expected with no terminal attached here).
- Documented as mandatory, project-wide, for all future modules: TEST_CASE_GENERATION_TEMPLATE.md ("Mail and OTP policy"), User-Access-Plan.md (decision 15), summary.md, .env / .env.example (STATIC_OTP), SETUP.md.

## 2026-10-08 (verified static OTP end-to-end; fixed a real Log out bug)
- Confirmed with a live run of the sanity suite (SAN-FLEXCAP-END-TO-END-SANITY) that STATIC_OTP=000000 works for both Supplier and Buyer login with zero prompts and zero mailbox interaction, as requested ("for all the same static otp-000000").
- That run surfaced a real bug in MY OWN script, not UAT: clicking "Log out" opens a confirmation dialog ("Are you sure want to exit?" / Logout / No) that a bare click on "Log out" never dismisses, so the session never actually ended (S18/S26 failed, received URL still /airlines/onBoarding or /freightForwarders/onBoarding instead of /login).
- Fixed by adding a shared `logout(page)` helper in utils/flows.ts (clicks Log out, confirms the dialog if it appears, then waits for /login) and switching UA-LOGIN-LOGOUT-ENDS-SESSION and the sanity spec's two Log out checks to use it instead of a bare `.click()`.
- Re-ran the full sanity suite: 26/26 PASS, 0 fail, 0 skip, zero terminal prompts needed. BUG-SAN-001 (from an earlier unrelated backend-down run) automatically shows Resolved in the Excel Bug List now that the module passes clean.
