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

7. **Mail is handled by the person, not the suite (owner decision).** The suite does not read yopmail by default. Whenever an OTP, verification link or reset link is needed,
   the run pauses in the terminal, names the mailbox to open (`https://yopmail.com/?<inbox>`) and waits for the value to be typed or pasted. This needs a real terminal.
   `--auto-mail` re-enables the built-in yopmail reader (useful for unattended runs; it still falls back to asking).
8. **One script file per scenario ID** stays (RULES.md §3.5); the whole module still runs with one command.
9. **Forgot Password in UAT is link-based**, not OTP-based as the manual suite assumed. UA-FP-TAMPERED-AND-USED-LINK, UA-FP-RESET-PAGE-WITHOUT-TOKEN and UA-FP-NEW-REQUEST-INVALIDATES-OLD-LINK were re-scoped to the reset link.
10. **Main accounts:** supplier1000@yopmail.com and buyer1000@yopmail.com (password Test@1234 from `.env`). A new account lands on **Onboarding**, not the Dashboard.
11. **Unconfirmed locators:** the reset page (password boxes, submit button) is matched generically until the first real run confirms it.
12. `--headed` shows the browser while running; `--slowmo=500` slows it down.

## Known defects from the manual run (expected to fail until fixed)

Scenarios asserting the *correct* behaviour will fail while these exist. They are tagged `@known-defect` and reported separately, not as new regressions.
- Resend verification email does nothing: UA-REG-RESEND-VERIFICATION-EMAIL (manual TC_VERPOPUP_04, TC_LOGIN_UNVER_02)
- Login of an unverified account shows "Invalid credentials" instead of the verification prompt: UA-LOGIN-UNVERIFIED-ACCOUNT-PROMPT (manual TC_LOGIN_UNVER_01)
- OTP screen button says "Login" instead of "Verify"; expired-OTP message handling: touches UA-LOGIN-EXPIRED-OTP-REJECTED, UA-LOGIN-OTP-INPUT-AND-RESEND-RULES (manual TC_LOGIN_OTP_03, 05)

## Not automated (manual or out of scope)

- **Verification-link expiry** and **OTP expiry waits** longer than a few minutes: time-based; validity period to be confirmed. Expiry of the OTP is
  automated only if the period is short enough for a run.
- **UA-LOGIN-SESSION-TIMEOUT (30-minute session timeout)** is tagged `@slow` and runs only when requested.

## Open items (need live screen / owner input)

- Register role options: "Airlines / Freight-forwarders" in the manual suite vs. "I am a Buyer / I am a Supplier" in PRD REQ-UM-009. Check which UAT shows.
- UAT URL, passwords for the two shared accounts (or whether they must be created by UA-REG-SUPPLIER-VALID-REGISTRATION / UA-REG-BUYER-VALID-REGISTRATION).
- A dual-role UAT account for UA-LOGIN-ROLE-SWITCH. Location of the profile screen for UA-LOGIN-PROFILE-UPDATE.
- Do the shared accounts already exist and have they completed onboarding? UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP and UA-LOGIN-BUYER-VALID-LOGIN-OTP expect Dashboard, not Onboarding.
