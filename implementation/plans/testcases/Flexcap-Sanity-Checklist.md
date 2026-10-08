# FlexCapPro Sanity — Checklist (folder `flexcap_Sanity_reg_suit`)

- **What it is:** a quick, read-only check that the whole application is alive and its main paths work. Breadth over depth: the module suites hold the depth.
- **How it is built:** ONE spec file, ONE flow (owner decision, CONFIRMED 2026-10-07: an exception to RULES.md §3.5 for this sanity folder only):
  `source/web/chrome/specs/flexcap_Sanity_reg_suit/SAN-FLEXCAP-END-TO-END-SANITY.spec.ts`
- **Flow:** public screens (signed out) -> Supplier: one login, every signed-in check on that screen, then log out -> Buyer: the same -> done.
- **Result:** every check is recorded PASS / FAIL / SKIP and the run continues after a failure. A check that cannot run because something it depends on failed is SKIP with the reason.
- **Run:** `npm run sanity` (add `--headed` to watch). The run asks you twice, for the Supplier OTP and the Buyer OTP, naming the mailbox.
- **Report:** printed in the terminal, `executions/<run>/triage.md` (section "Sanity checks"), and Allure at `reports/allure/flexcap_Sanity_reg_suit/<date-time>/` (`npm run report -- --module=flexcap_Sanity_reg_suit`).
- **Needs:** `supplier1000@yopmail.com` and `buyer1000@yopmail.com` already registered and verified (create them with the user-access Register scenarios), password in `.env`.
- **Never does:** submit an onboarding application, register a new account, reset a password, lock an account or change any data.

| # | Phase | Check |
|---|---|---|
| S01 | Public | Backend API answers: the login API returns a normal response, not a 5xx or a timeout |
| S02 | Public | Login page loads with email, password, Login button, "Create an Account" and "Forgot Password?" |
| S03 | Public | "Create an Account" opens the Register page |
| S04 | Public | Register page shows both role tabs, all five fields, Sign Up and the terms link; the Buyer tab keeps the same fields |
| S05 | Public | Register with everything empty shows the five required messages and sends nothing |
| S06 | Public | "Login" link on the Register page returns to the Login page |
| S07 | Public | Forgot Password panel opens (heading, email field, Submit) and Back to Login returns |
| S08 | Public | Login with an unknown email is refused with "Invalid credentials" (API 401) and no OTP step |
| S09 | Public | A protected page opened while signed out redirects to Login |
| S10 | Public | Backoffice login page loads (title, "Back Office Portal Login", password field, Login button) |
| S11 | Supplier | The Supplier account is configured in `.env` |
| S12 | Supplier | Email and password are accepted and the OTP step appears (6 boxes, Verify disabled) |
| S13 | Supplier | The correct OTP signs in and lands inside the application (Log out visible) |
| S14 | Supplier | The landing page greets the user and shows the application welcome |
| S15 | Supplier | The onboarding guide lists its 8 steps (Business Details, Business Info, Commercial License, Articles of Association, Stakeholder Details, Authorized Signatory Details, Bank Account Details, Account Admin) |
| S16 | Supplier | The user stays signed in after a page reload |
| S17 | Supplier | The session produced no server errors (HTTP 5xx) and no page errors |
| S18 | Supplier | Log out ends the session: back to Login, the Back button and a direct URL do not restore it |
| S19-S26 | Buyer | The same eight checks as S11-S18 for the Buyer (the guide's expected steps exclude Bank Account Details) |

## Not covered by this sanity (on purpose or for now)
- **Anything behind onboarding:** Dashboard, Invoices, Payments, Reports, Payables, Cards. The main accounts have not completed onboarding, so those screens are not reachable. They join the sanity as each module is built.
- **Backoffice sign-in and its screens:** no Backoffice credentials were given. Only its public login page is checked.
- **Creating accounts, resetting passwords, submitting applications:** destructive or irreversible, so they stay in the module suites.

## Notes
- If the backend is down (S01 fails), every login-dependent check is SKIPPED with that reason, so one root cause shows as one failure.
- The OTP may expire quickly (the Forgot Password API reported 59 seconds). If S13 or S21 fails with a rejected OTP, type the code faster or confirm the real validity.
