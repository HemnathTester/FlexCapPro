# Project Summary

Living snapshot. Read first, every AI session; update at the end of every session.

## Status
Skeleton + web Playwright scaffold and CLI in place. No modules built yet.

## Coverage by module
Revised after reading the existing manual regression suite (knowledge/doc/Flexcap_Pro_Regression_Usermodule_Testcases 1.xlsx: 2,201 manual TCs, 22 tabs,
Supplier/Buyer portal only; only Login executed: 28 pass / 5 fail). "Manual TCs" = existing count, used as reference input only, not as the scenario list.
Criticality is a proposal. Order = suggested build order.
| # | Module | Portal | Criticality | Manual TCs | Scenarios | Scripts | Stable? |
|---|--------|--------|-------------|-----------|-----------|---------|---------|
| 1 | user-access (Register, Login, Forgot Password) | Supplier/Buyer | Critical | 106 | 33 (8 Positive, 6 Negative, 19 Edge) | 33 scripted | Not yet stable: only part of Register has run (3 pass / 7 fail, 5 of those were script bugs, fixed, not rerun); Login and Forgot Password not run yet |
| 2 | business-onboarding (supplier + buyer wizards) | Supplier/Buyer | Critical | 477 | 27 planned | 0 | Not started: needs live capture |
| 3 | entity-management | Supplier/Buyer | Critical | 542 | 0 | 0 | - |
| 4 | relationships (Supplier "Buyers", Buyer "Add Supplier") | Supplier/Buyer | Critical | 156 | 0 | 0 | - |
| 5 | invoices (single, bulk CSV, PDF, API, statuses) | Supplier | Critical | 131 | 0 | 0 | - |
| 6 | payments / payables | Buyer | Critical | 84 | 0 | 0 | - |
| 7 | bank-card (Payment Methods, Add Card, penny verification) | Buyer | Critical | 37 | 0 | 0 | - |
| 8 | backoffice-verification (KYC, Finance, PSP, freeze) | Backoffice | Critical | 0 | 0 | 0 | - |
| 9 | reconciliation-settlement (Referral + BPSP) | Backoffice | Critical | 0 | 0 | 0 | - |
| 10 | dashboard | Supplier/Buyer | Standard | 184 | 0 | 0 | - |
| 11 | business-user-admin (users, roles per entity) | Supplier | Standard | 83 | 0 | 0 | - |
| 12 | documents-docusign | Backoffice + portal | Standard | 0 | 0 | 0 | - |
| 13 | admin-config (roles, fees, commission, limits) | Backoffice | Standard | 0 | 0 | 0 | - |
| 14 | notifications (email + in-app) | All | Standard | 145 | 0 | 0 | - |
| 15 | reports | Supplier/Buyer | Light | 148 | 0 | 0 | - |
| 16 | help-support (FAQ, tickets) | Supplier/Buyer | Light | 108 | 0 | 0 | - |

## Environment
UAT only (`TARGET_ENV=UAT` enforced by the CLI). Test accounts in `.env`: buyer01@yopmail.com, supplier01@yopmail.com (mobile numbers: dummy).

## Sanity
`npm run sanity` runs the one-flow sanity (26 checks) from `specs/flexcap_Sanity_reg_suit/`. Checklist: `implementation/plans/testcases/Flexcap-Sanity-Checklist.md`. Allure: `reports/allure/flexcap_Sanity_reg_suit/`.

## Reporting
Every run also writes an **Excel test report** (the owner's 20-column header, defect list, a screenshot for every step, run history) to `reports/excel_report/<module>/<module>_<date>_<time>.xlsx` (open: `npm run excel -- --module=<module>`). Teammate setup: `SETUP.md`.
Every run writes an Allure report to `reports/allure/<module>/<date-time>/` (open: `npm run report -- --module=<module>`) and a failures-first `executions/<runId>/triage.md`.

## Open items
- UAT backend (https://uat.freightpay-middleware.flexcappro.com) returned HTTP 502 on 2026-10-07: logins and registration cannot work until it is back. First sanity run: 8 pass, 1 fail (backend), 17 skipped.
- Platform decided: web (Playwright, Chrome) at `source/web/chrome/`.
- Docs in `knowledge/doc/`: PRD v1.4, BPSP flow pptx, Referral flow pptx, existing manual regression xlsx. Companion BRD not yet uploaded.
- Existing xlsx: Reports and Help tabs are identical for Supplier and Buyer (171/96 rows each); many TCs marked not video-verified; Register tabs are per industry (Airlines...) but PRD REQ-UM-009 changes this to "I am a Buyer/Supplier".
- user-access: 33 scripts + both test-case documents written (implementation/plans/testcases/User-Access-*.md). Forgot Password rewritten for the OTP flow. NEXT: the owner runs the whole module once from a terminal (prompts for verify-email only — OTP is bypassed, see below) and sends the results; script mistakes get fixed, real UAT defects get listed; then module 2 (business-onboarding) starts.
- **OTP bypass (2026-10-08, project-wide, mandatory for all current and future modules):** dev team fixed the UAT login/Forgot-Password OTP to a static test
  value (`STATIC_OTP` in `.env`, default `000000`). The suite now types this directly for every OTP step — no mailbox read, no window, no prompt. Only
  "Verify Your Email" still prompts the person. See `implementation/plans/module-plans/User-Access-Plan.md` decision 15 and the template's "Mail and OTP
  policy" section. Two user-access scenarios whose premise was "the OTP changes" were retired (`test.fixme`) pending dev-team confirmation.
- business-onboarding (module 2): STARTED at the owner's instruction. Plan and 27 planned scenarios written; next step is the owner running `npm run session:supplier` so the wizard can be captured live. See module-plans/Business-Onboarding-Plan.md.
- Confirm module list, criticality and first module.
- Define the CLI command (`<cli-command> --product=<product> --module=<module>`).
