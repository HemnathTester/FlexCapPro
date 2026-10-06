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
| 1 | user-access (Register, Login, Forgot Password) | Supplier/Buyer | Critical | 106 | 33 (8 Positive, 6 Negative, 19 Edge) | 33 scripted | Not yet stable: Register run 2026-10-06 = 3 pass / 7 fail (4 were script bugs, fixed, not rerun) |
| 2 | business-onboarding (supplier + buyer wizards) | Supplier/Buyer | Critical | 477 | 0 | 0 | - |
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

## Open items
- Platform decided: web (Playwright, Chrome) at `source/web/chrome/`.
- Docs in `knowledge/doc/`: PRD v1.4, BPSP flow pptx, Referral flow pptx, existing manual regression xlsx. Companion BRD not yet uploaded.
- Existing xlsx: Reports and Help tabs are identical for Supplier and Buyer (171/96 rows each); many TCs marked not video-verified; Register tabs are per industry (Airlines...) but PRD REQ-UM-009 changes this to "I am a Buyer/Supplier".
- user-access: all 33 scripts written (specs/user-access/). Needs a full interactive run by the owner (OTP/links are typed in at the prompt). Test-case docs (User-Access-TestCases.md, User-Access-UserScenarios.md) not written yet. See module-plans/User-Access-Plan.md.
- Confirm module list, criticality and first module.
- Define the CLI command (`<cli-command> --product=<product> --module=<module>`).
