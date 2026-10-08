# User Access — Module Plan

Reusable decisions and standing checks for this module. Read before any session on user-access (RULES.md §5).

- Module folder: `source/web/chrome/specs/user-access/` (one script per scenario ID)
- Criticality: **Critical** (identity)
- Scope: Register, Verification, Login (password + OTP), Forgot Password, route guard, session, logout, role switching, profile
- Requirements: REQ-UM-001..009, BR-021, BR-022, BR-024 (PRD v1.4)
- Reference only (not the scenario list): Register / Login / Forgot Password tabs of the manual suite, 106 cases

## Standing decisions

1. **Environment: UAT only.** Tests never run against any other environment. The CLI refuses to run unless `TARGET_ENV=UAT` in `.env`.
2. **Shared accounts are protected.** `buyer01@yopmail.com` and `supplier01@yopmail.com` are used only by the happy-path login/profile scenarios
   (UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP, UA-LOGIN-BUYER-VALID-LOGIN-OTP, UA-LOGIN-LOGOUT-ENDS-SESSION, UA-LOGIN-PROFILE-UPDATE). Anything that locks, resets or changes a password or state (UA-LOGIN-LOCKOUT-AFTER-WRONG-PASSWORDS, UA-LOGIN-LOCKOUT-AFTER-WRONG-OTPS, UA-FP-*, UA-REG-*) uses a **disposable
   yopmail account created in that run** and recorded in `fixtures/created-data.xlsx` (Users sheet). A locked or reset shared account breaks every later run.
3. **Disposable email pattern:** `ua.<scenarioId>.<timestamp>@yopmail.com` (lowercase). Any yopmail address works without setup.
4. **Mobile numbers are dummy** (confirmed by the owner). Format is confirmed from the live Register screen before use.
5. **OTP and verification emails arrive in yopmail.** Reading the inbox from a script is the main technical risk (possible captcha/rate-limit).
   Confirm the approach on the live app before writing scripts; log the decision here.
6. **Edge cases are first-class.** Of 33 scenarios, 19 are Edge (boundary, state, security, recovery) per the owner's instruction.

## Scenario naming

Scenario IDs describe what they check (e.g. `UA-LOGIN-WRONG-OTP-REJECTED`), not a running number. The ID is the script file name, the start of the test title,
the key in scenario-catalog.md and the row label in every report. Format: `UA-<AREA>-<WHAT-IS-CHECKED>`. Earlier drafts used numbers (UA-LOGIN-06 and so on).

## Decisions added 2026-10-06

7. **Mail policy (owner decision, final):** the suite never reads yopmail by default. For every OTP (login, forgot password) it asks the person to type the code; for
   "Verify Your Email" it asks the person to click the button in the mail and on the page that opens, then type "done". The suite does NOT open yopmail (its "Verify you are human" check blocks automated windows): each prompt prints an ACTION FOR YOU with the mailbox link, and the person uses their own browser. Needs a real terminal.
   `--auto-mail` lets the suite read yopmail and open verification links itself (unattended runs). Same policy for every module (see TEST_CASE_GENERATION_TEMPLATE.md).
8. **One script file per scenario ID** stays (RULES.md §3.5); the whole module still runs with one command.
9. **Forgot Password in UAT is link-based**, not OTP-based as the manual suite assumed. UA-FP-WRONG-AND-USED-OTP-REJECTED, UA-FP-CHANGE-PASSWORD-NEEDS-VALID-OTP and UA-FP-NEW-REQUEST-INVALIDATES-OLD-OTP were re-scoped to the reset link.
   **CORRECTION (2026-10-06, from the owner's inbox screenshot):** Forgot Password actually sends an **OTP email** ("Forgot Password OTP", 6 digits) even though the page says "link" (a wording bug to report).
   DONE 2026-10-06 (owner go-ahead): the six link-based UA-FP scenarios were rewritten for the OTP flow (FULL-RESET-BY-OTP, WRONG-AND-USED-OTP-REJECTED, NEW-PASSWORD-RULES, REUSE-OLD-PASSWORD, NEW-REQUEST-INVALIDATES-OLD-OTP, CHANGE-PASSWORD-NEEDS-VALID-OTP).
   Change-password locators (password boxes, submit button) are generic until the first real run confirms them.
10. **Main accounts:** supplier1000@yopmail.com and buyer1000@yopmail.com (password Test@1234 from `.env`). A new account lands on **Onboarding**, not the Dashboard.
11. **Unconfirmed locators:** the reset page (password boxes, submit button) is matched generically until the first real run confirms it.
12. `--headed` shows the browser while running; `--slowmo=500` slows it down.

13. **Allure report after every run.** Stored at `reports/allure/<module>/<YYYY-MM-DD_HH-mm-ss>/index.html` (copy of the newest in `.../latest/`, which also carries trend history).
    Grouped by module (parent suite), spec file (suite), screen (feature) and type (Positive/Negative/Edge). Each scenario shows start/stop time, every action as a step,
    screenshots at key moments and, on failure, the screen-hierarchy dump. Open with `npm run report -- --module=user-access`.
14. `--scenario` takes a name prefix or a comma-separated list (e.g. `--scenario=UA-REG,UA-FP`). Do not use `|`: the shell splits it.
15. **OTP is a fixed test value (dev team decision, 2026-10-08): `STATIC_OTP` in `.env`, default `000000`.** Every login and Forgot Password OTP step types
    this value directly (via `getMail`, which now resolves instantly with no mailbox read, window or prompt). `WRONG_OTP` (in `utils/flows.ts`) is used
    wherever a scenario needs a deliberately wrong code, instead of a hardcoded `'000000'`. "Verify Your Email" is unchanged: still the real emailed link,
    still prompts the person. This applies to every module, not just user-access, until the dev team reverts it.
    - Two scenarios whose whole point was that the OTP **changes** (on resend / across requests) no longer have a real premise and were retired to
      `test.fixme`, pending dev-team confirmation of whether the static OTP is single-use or time-limited: **UA-LOGIN-EXPIRED-OTP-REJECTED** and
      **UA-FP-NEW-REQUEST-INVALIDATES-OLD-OTP**.
    - `UA-LOGIN-OTP-INPUT-AND-RESEND-RULES` was adjusted: it no longer asserts resend issues a *different* code, only that the fixed OTP still logs in
      after a resend (the box/paste/countdown checks are unchanged).
    - `UA-FP-WRONG-AND-USED-OTP-REJECTED` step 3 (reusing an OTP after a new request) is now reported via `console.log`, not a hard assertion, since "old"
      and "new" are the identical static value: confirm the intended reuse behaviour with the dev team before making it a hard pass/fail again.

## Known defects from the manual run (expected to fail until fixed)

Scenarios asserting the *correct* behaviour will fail while these exist. They are tagged `@known-defect` and reported separately, not as new regressions.
- Resend verification email does nothing: UA-REG-RESEND-VERIFICATION-EMAIL (manual TC_VERPOPUP_04, TC_LOGIN_UNVER_02)
- Login of an unverified account shows "Invalid credentials" instead of the verification prompt: UA-LOGIN-UNVERIFIED-ACCOUNT-PROMPT (manual TC_LOGIN_UNVER_01)
- OTP screen button says "Login" instead of "Verify"; expired-OTP message handling: touches UA-LOGIN-EXPIRED-OTP-REJECTED, UA-LOGIN-OTP-INPUT-AND-RESEND-RULES (manual TC_LOGIN_OTP_03, 05)

## Not automated (manual or out of scope)

- **Verification-link expiry**: time-based (24 hours); not automated.
- **OTP expiry**: superseded by decision 15 above (OTP is now a fixed test value); see UA-LOGIN-EXPIRED-OTP-REJECTED (`test.fixme`).
- **UA-LOGIN-SESSION-TIMEOUT (30-minute session timeout)** is tagged `@slow` and runs only when requested.

## Open items (need live screen / owner input)

- Register role options: "Airlines / Freight-forwarders" in the manual suite vs. "I am a Buyer / I am a Supplier" in PRD REQ-UM-009. Check which UAT shows.
- UAT URL, passwords for the two shared accounts (or whether they must be created by UA-REG-SUPPLIER-VALID-REGISTRATION / UA-REG-BUYER-VALID-REGISTRATION).
- A dual-role UAT account for UA-LOGIN-ROLE-SWITCH. Location of the profile screen for UA-LOGIN-PROFILE-UPDATE.
- Do the shared accounts already exist and have they completed onboarding? UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP and UA-LOGIN-BUYER-VALID-LOGIN-OTP expect Dashboard, not Onboarding.
