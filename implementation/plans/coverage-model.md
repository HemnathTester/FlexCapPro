# Coverage Model

Why each scenario earns its place. Fill one row per scenario ID; mark each dimension Y (covered by this
scenario) or - (not applicable). Keep the set small and high-value.

Dimensions: Functional, Negative, Boundary/Edge, State, Role, Data, Integration, Recovery, UI/Visual, API, Regression impact

| ID | Functional | Negative | Boundary/Edge | State | Role | Data | Integration | Recovery | UI/Visual | API | Regression impact | Rationale |
|----|-----------|----------|---------------|-------|------|------|-------------|----------|-----------|-----|-------------------|-----------|
| UA-REG-SUPPLIER-VALID-REGISTRATION | Y | - | - | - | Y | Y | Y | - | - | - | - | REQ-UM-001, REQ-UM-009 |
| UA-REG-BUYER-VALID-REGISTRATION | Y | - | - | - | Y | Y | Y | - | - | - | - | REQ-UM-001, REQ-UM-009 |
| UA-REG-REQUIRED-FIELDS-AND-EMAIL-FORMAT | - | Y | - | - | - | - | - | - | Y | - | - | Manual: TC_REG_AIR_07/08 |
| UA-REG-DUPLICATE-EMAIL | - | Y | Y | - | - | Y | - | - | - | - | - | Manual: TC_REG_AIR_09, TC_REG_FF_10 |
| UA-REG-PASSWORD-RULES | - | Y | - | - | - | Y | - | - | - | - | - | Manual: TC_REG_AIR_10/11 |
| UA-REG-FIELD-LENGTH-LIMITS | - | - | Y | - | - | Y | - | - | - | - | - | Manual: TC_REG_AIR_12/14/16. Dummy mobile numbers only |
| UA-REG-INJECTION-STRINGS | - | Y | Y | - | - | Y | - | - | - | - | - | Manual: TC_REG_AIR_13 |
| UA-REG-DOUBLE-CLICK-SIGNUP | - | - | Y | Y | - | - | Y | - | - | - | - | Manual: TC_REG_AIR_15 |
| UA-REG-VERIFY-LINK-ONCE-AND-TAMPERED | Y | Y | - | Y | - | - | Y | - | - | - | - | Manual: TC_EMAILVER_01/03/05. Expiry is time-based: manual only (see Plan) |
| UA-REG-RESEND-VERIFICATION-EMAIL | Y | - | - | - | - | - | Y | Y | - | - | - | KNOWN DEFECT: manual TC_VERPOPUP_04, TC_LOGIN_UNVER_02 (Resend does nothing) |
| UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP | Y | - | - | Y | Y | - | Y | - | - | - | - | REQ-UM-002. Account: supplier01@yopmail.com |
| UA-LOGIN-BUYER-VALID-LOGIN-OTP | Y | - | - | Y | Y | - | Y | - | - | - | - | REQ-UM-002. Account: buyer01@yopmail.com |
| UA-LOGIN-NEW-USER-GOES-TO-ONBOARDING | Y | - | - | Y | - | - | - | - | - | - | - | Manual: TC_ONBOARD_REDIR_01 |
| UA-LOGIN-WRONG-PASSWORD-UNKNOWN-EMAIL-EMPTY | - | Y | - | - | - | Y | - | - | - | - | - | Manual: TC_LOGIN_06/07/08 |
| UA-LOGIN-UNVERIFIED-ACCOUNT-PROMPT | Y | Y | - | Y | - | - | - | - | - | - | - | KNOWN DEFECT: manual TC_LOGIN_UNVER_01 failed (shows "Invalid credentials") |
| UA-LOGIN-WRONG-OTP-REJECTED | - | Y | - | Y | - | - | - | - | - | - | - | Manual: TC_LOGIN_OTP_08 |
| UA-LOGIN-EXPIRED-OTP-REJECTED | - | - | Y | Y | - | - | - | Y | - | - | - | Manual: TC_LOGIN_OTP_09. OTP validity period: confirm on live screen |
| UA-LOGIN-LOCKOUT-AFTER-WRONG-PASSWORDS | - | Y | Y | Y | - | - | - | - | - | - | - | BR-022. Disposable account only (never buyer01/supplier01) |
| UA-LOGIN-LOCKOUT-AFTER-WRONG-OTPS | - | Y | Y | Y | - | - | - | - | - | - | - | Manual: TC_LOGIN_OTP_10. Disposable account only |
| UA-LOGIN-OTP-INPUT-AND-RESEND-RULES | - | - | Y | Y | - | - | - | Y | Y | - | - | Manual: TC_LOGIN_OTP_03/05/06/11/12/13. Known failures on resend/expiry messages |
| UA-LOGIN-ROUTE-GUARD-SIGNED-OUT | - | Y | - | Y | Y | - | - | - | - | - | - | REQ-UM-003, BR-024. Manual: TC_ONBOARD_REDIR_03 |
| UA-LOGIN-SESSION-TIMEOUT | - | - | Y | Y | - | - | - | - | - | - | - | REQ-UM-006, BR-021. Slow: tag @slow, opt-in only |
| UA-LOGIN-LOGOUT-ENDS-SESSION | Y | - | - | Y | - | - | - | - | - | - | - | REQ-UM-002 |
| UA-LOGIN-ROLE-SWITCH | - | - | - | Y | Y | Y | - | - | - | - | - | REQ-UM-004. Needs a dual-role UAT account (pending) |
| UA-LOGIN-PROFILE-UPDATE | Y | - | - | - | - | Y | - | - | - | - | - | REQ-UM-005. Screen location to confirm on live app |
| UA-FP-FULL-RESET-BY-LINK | Y | - | - | Y | - | - | Y | Y | - | - | - | Disposable account only |
| UA-FP-UNKNOWN-AND-INVALID-EMAIL | - | Y | - | - | - | Y | - | - | - | - | - | Manual: TC_FP_EMAIL_05/06/07/09/10 |
| UA-FP-TAMPERED-AND-USED-LINK | - | Y | Y | Y | - | - | - | - | - | - | - | Reset is link-based in UAT (not OTP): tampered/used link. Manual: TC_FP_OTP_* not applicable |
| UA-FP-NEW-PASSWORD-RULES | - | Y | - | - | - | Y | - | - | - | - | - | Manual: TC_FP_CHANGEPW_04-07 |
| UA-FP-REUSE-OLD-PASSWORD | - | Y | - | - | - | Y | - | - | - | - | - | Manual: TC_FP_CHANGEPW_08 |
| UA-FP-RESET-PAGE-WITHOUT-TOKEN | - | Y | - | Y | Y | - | - | - | - | - | - | Manual: TC_FP_CHANGEPW_10 |
| UA-FP-NEW-REQUEST-INVALIDATES-OLD-LINK | - | - | Y | Y | - | - | - | Y | - | - | - | Manual: TC_FP_OTP_13, TC_FP_CHANGEPW_09 |
| UA-FP-RATE-LIMIT | - | Y | Y | - | - | - | - | - | - | - | - | Manual: TC_FP_EMAIL_08 |
