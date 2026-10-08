# Test Case Generation Template

Tag this file at the start of every new module's test-case generation (RULES.md §3).
Before anything else: read `summary.md`, `task_log.md`, and the module's Plan file.

## Module header (state first, never leave implicit)
- Module:
- Criticality: Critical / Standard / Light  (blocks core flow, touches money or identity = Critical)
- Source of truth used (files in `knowledge/`):

## Process
1. Check `scenario-catalog.md` first. Reuse an existing ID before creating one.
2. Ground every step in the live screen (screenshot / accessibility tree / DOM), never memory.
   Use reference screenshots in `knowledge/doc/` only as a cross-check.
2b. Cache every element found in `locator-maps/<Module>-Elements.md` (name, how to find it, what it does).
    Read that map first on every later script; re-check only on a detected screen mismatch.
3. Fill the 11-dimension check in `coverage-model.md` for every scenario.
4. Write `testcases/<Module>-TestCases.md` in the fixed format below.
5. One script file per scenario ID, at `source/<platform>/<product>/specs/<module>/`. Never bundle.
6. Write `testcases/<Module>-UserScenarios.md`: plain-language end-to-end journeys (Approach 1, 2, 3...).
7. Update `scenario-catalog.md`, `summary.md`, `task_log.md`, and the module Plan file.

## Fixed test-case format
```
### TC-<ID> — <title>
- Priority:
- Type: Positive / Negative / Edge
- Preconditions:
- Test Data:
- Steps:
  1.
  2.
- Expected Result:
- Automation script path:
- Notes:
```
No table-only shortcuts, no alternate layouts.

## Mail and OTP policy (every module)
- **OTP is a fixed test value (dev team decision, 2026-10-08): `STATIC_OTP` in `.env`, default `000000`.** For every login and Forgot Password step, call
  `getMail(...)` with text containing "login code" / "OTP" as before — it now resolves instantly to `STATIC_OTP` with no mailbox read, no window and no
  prompt. Never type an OTP literal directly in a spec; import `STATIC_OTP` from `utils/flows.ts` (and `WRONG_OTP` for a scenario that needs a deliberately
  wrong code — never reuse `'000000'` for that). This applies project-wide, to every module, present and future, until the dev team changes it back.
- **"Verify Your Email" is unaffected**: that still goes through the real emailed link. Use `askToVerify(inbox)` / `verifyFromMail(...)` (the person clicks
  the button and types "done"). Every prompt names the mailbox to open.
- The suite does not open yopmail (its "Verify you are human" check blocks automated windows). Each prompt prints an ACTION FOR YOU with the mailbox link; the person uses their own browser. (`--open-mail-window` is an opt-in that opens a visible mailbox window.)
- Take pre-action snapshots with `snap(browser, inbox)`; it returns an empty set unless `--auto-mail` is used. (For OTP this is now a no-op kept only for compatibility.)
- `--auto-mail` is only for unattended runs: the suite reads yopmail itself and opens verification links; a failed read still falls back to asking.
- A scenario whose entire point was "OTP changes on resend / expires over time" no longer has a real premise under a static OTP; two such scenarios in
  user-access were retired to `test.fixme` pending the dev team confirming whether the static OTP is single-use or time-limited (see User-Access-Plan.md).

## Excel report (every module, automatic)
After every run the CLI builds `reports/excel_report/<module>/<module>_<YYYY-MM-DD>_<HH-mm-ss>.xlsx` (file name = module + date + time; the step screenshots sit beside it in `<same name>_evidence/`). Nothing to add in a spec: it reads the run results,
this module's `implementation/plans/testcases/*-TestCases.md` (steps, data, expected result) and the steps the recorder captured.
- **Test Execution** sheet, the owner's header exactly: S.No | Test Case ID | Module | Test Scenario | Test Steps | Expected Result | Actual Result | Status | Issue Type | Issue Description | Failed API | Defect ID | Severity | Screenshot | Executed On | Duration | Priority | Scenario Type | Technical Details (QA) | Run ID. Status is PASS / FAIL / NOT EXECUTED.
- **Steps & Screenshots** sheet: every action the test performed (open, click, type, press, tick, choose, upload) with its result and a screenshot. Passwords and OTPs are masked.
- **Bug List** sheet: every failed test case gets a Defect ID (e.g. BUG-UA-001) that is kept between runs; it shows Open, or Resolved once the test case passes again. Issue Type and Severity are classified automatically from the failure text (Environment / Backend, Validation / Functional, Automation / Script, Functional): the tester confirms them.
- **Run History** sheet: the result of every test case in every earlier run of this module.
- Keep each module's `<Module>-TestCases.md` in the fixed format (RULES.md §3.4): the report copies its fields.
- Switches: `--no-excel` skips the report; `--no-step-shots` keeps the step list but skips the screenshots (faster).
