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
| UA-FP-FULL-RESET-BY-OTP | Y | - | - | Y | - | - | Y | Y | - | - | - | Disposable account only |
| UA-FP-UNKNOWN-AND-INVALID-EMAIL | - | Y | - | - | - | Y | - | - | - | - | - | Manual: TC_FP_EMAIL_05/06/07/09/10 |
| UA-FP-WRONG-AND-USED-OTP-REJECTED | - | Y | Y | Y | - | - | - | - | - | - | - | Reset is link-based in UAT (not OTP): tampered/used link. Manual: TC_FP_OTP_* not applicable |
| UA-FP-NEW-PASSWORD-RULES | - | Y | - | - | - | Y | - | - | - | - | - | Manual: TC_FP_CHANGEPW_04-07 |
| UA-FP-REUSE-OLD-PASSWORD | - | Y | - | - | - | Y | - | - | - | - | - | Manual: TC_FP_CHANGEPW_08 |
| UA-FP-CHANGE-PASSWORD-NEEDS-VALID-OTP | - | Y | - | Y | Y | - | - | - | - | - | - | Manual: TC_FP_CHANGEPW_10 |
| UA-FP-NEW-REQUEST-INVALIDATES-OLD-OTP | - | - | Y | Y | - | - | - | Y | - | - | - | Manual: TC_FP_OTP_13, TC_FP_CHANGEPW_09 |
| UA-FP-RATE-LIMIT | - | Y | Y | - | - | - | - | - | - | - | - | Manual: TC_FP_EMAIL_08 |
| BO-BIZINFO-VALID-DETAILS-SAVED | Y | - | - | Y | - | Y | - | - | - | - | - | REQ-BM-001. Manual: Business Info (82 cases) reference |
| BO-BIZINFO-REQUIRED-FIELDS-AND-AUTOSCROLL | - | Y | - | - | - | - | - | - | Y | - | - | REQ-BM-018 |
| BO-BIZINFO-FIELD-FORMATS | - | Y | - | - | - | Y | - | - | - | - | - | Manual: TC_BIZ_* |
| BO-BIZINFO-LENGTH-AND-INJECTION | - | - | Y | - | - | Y | - | - | - | - | - | Same weakness found at Register (UA-REG-FIELD-LENGTH-LIMITS) |
| BO-BIZINFO-VOLUME-BOUNDARIES | - | - | Y | - | - | Y | - | - | - | - | - | Manual: volume fields |
| BO-LOGO-MANDATORY | Y | Y | - | - | - | - | - | - | - | - | - | REQ-BM-014, BR-036 |
| BO-LOGO-FORMAT-AND-SIZE-LIMITS | - | Y | Y | - | - | - | - | - | - | - | - | REQ-BM-015, BR-036. Virus scan is not testable from the browser |
| BO-UPLOAD-HINTS-SHOWN | - | - | - | - | - | - | - | - | Y | - | - | REQ-BM-017 |
| BO-DOCUMENT-UPLOAD-RULES | - | Y | Y | - | - | - | - | - | - | - | - | REQ-BM-002. Manual: licence/AoA/bank-letter upload cases |
| BO-STAKEHOLDER-VALID-ADDED | Y | - | - | - | - | Y | - | - | - | - | - | Manual: Stakeholder Details (36 cases) |
| BO-STAKEHOLDER-ID-NUMBER-VALIDATION | - | Y | - | - | - | Y | - | - | - | - | - | REQ-BM-019 (validation logic was flagged incorrect) |
| BO-STAKEHOLDER-SHARE-PERCENTAGE-BOUNDARIES | - | - | Y | - | - | Y | - | - | - | - | - | Manual: Share Percentage cases |
| BO-STAKEHOLDER-DATE-OF-BIRTH-RULES | - | - | Y | - | - | Y | - | - | - | - | - | Manual: Date of Birth cases |
| BO-SIGNATORY-VALID-AND-EMAIL-RULES | - | Y | - | - | - | Y | - | - | - | - | - | REQ-BM-010 (the DocuSign agreement goes only to this email) |
| BO-BANK-IBAN-VALIDATION | - | Y | - | - | - | Y | - | - | - | - | - | REQ-BA-001, REQ-BA-002. Supplier wizard only |
| BO-BANK-CURRENCY-AED-ONLY | - | - | Y | - | - | - | - | - | - | - | Y | REQ-BM-025, BR-041 |
| BO-ADMIN-DETAILS-VALIDATION | - | Y | - | - | - | Y | - | - | - | - | - | Manual: Account Admin Details (18 cases) |
| BO-INVOICE-TEMPLATES-FILE-RULES | - | Y | Y | - | - | - | - | - | - | - | - | Manual: Invoice Templates (11 cases) |
| BO-TERMS-CLICK-TO-VIEW-AND-ACCEPT | Y | - | - | - | - | - | - | - | Y | - | - | REQ-BM-022 |
| BO-STEPPER-AND-COMPLETION-INDICATOR | - | - | - | Y | - | - | - | - | Y | - | - | REQ-BM-021 |
| BO-STEP-ORDER-CANNOT-BE-SKIPPED | - | Y | - | Y | - | - | - | - | - | - | - | Manual: Stepper & Progress |
| BO-SAVE-DRAFT-AND-RESUME | - | - | - | Y | - | - | - | Y | - | - | - | Manual: Save as Draft & Resume (8 cases) |
| BO-REVIEW-PAGE-SHOWS-ENTERED-DETAILS | Y | - | - | - | - | Y | - | - | - | - | - | REQ-BM-020 |
| BO-SUPPLIER-FULL-SUBMISSION | Y | - | - | Y | - | - | Y | - | - | - | - | REQ-BM-003, BR-001. IRREVERSIBLE in UAT: needs your approval before it runs |
| BO-BUYER-FULL-SUBMISSION | Y | - | - | Y | - | - | Y | - | - | - | - | REQ-BM-003. IRREVERSIBLE in UAT: needs your approval before it runs |
| BO-ALTERNATE-EMAIL-VERIFICATION | Y | - | - | Y | - | - | Y | - | - | - | - | REQ-BM-013. Screen location not yet found: blocked |
| BO-STATUS-LINK-NAVIGATION | Y | - | - | Y | - | - | - | - | - | - | - | REQ-BM-024. Needs Backoffice to set those statuses: blocked until that module |
| SAN-FLEXCAP-END-TO-END-SANITY | Y | Y | - | Y | Y | - | Y | - | Y | Y | Y | Sanity: breadth over depth, read-only. Depth lives in the module suites. |
| BO-SUPPLIER-VALID-ONBOARDING | Y | - | - | Y | Y | Y | Y | - | Y | - | Y | REQ-BO-001..005. Complete valid Supplier wizard |
| BO-BUYER-VALID-ONBOARDING | Y | - | - | Y | Y | Y | Y | - | Y | - | Y | REQ-BO-006..010. Complete valid Buyer wizard |
| BO-WIZARD-STEP-NAVIGATION | Y | - | - | Y | - | - | - | - | Y | - | - | Wizard navigation, step preservation & indicators |
| BO-MANDATORY-FIELDS-AND-INLINE-ERRORS | - | Y | - | - | - | - | - | - | Y | - | - | Empty mandatory field inline error validations |
| BO-INVALID-FORMATS-AND-TAX-ID | - | Y | - | - | - | Y | - | - | Y | - | - | Format validation: TRN, IBAN, Trade License |
| BO-DUPLICATE-BUSINESS-REGISTRATION | - | Y | Y | - | - | Y | Y | - | - | - | - | Duplicate TRN/Trade License rejection |
| BO-DOCUMENT-UPLOAD-INVALID-TYPES | - | Y | Y | - | - | Y | - | - | Y | - | - | Invalid file types (.exe) & size boundary |
| BO-FIELD-LENGTH-LIMITS-AND-SPECIAL-CHARS | - | - | Y | - | - | Y | - | - | - | - | - | Max/min length limits, special chars, whitespace |
| BO-WIZARD-PAGE-REFRESH-AND-BACK | - | - | Y | Y | - | - | - | Y | - | - | - | Page refresh, back button & draft recovery |
| BO-SESSION-TIMEOUT-DURING-ONBOARDING | - | - | Y | Y | - | - | - | Y | - | - | - | Inactivity timeout during wizard execution |
| BO-E2E-CRITICAL-REGRESSION-FLOW | Y | - | - | Y | Y | Y | Y | Y | Y | - | Y | Critical E2E regression onboarding flow |
| BO-UBO-PEP-DECLARATIONS | - | - | Y | Y | - | Y | - | - | Y | - | - | UBO ownership >25% and PEP declaration checks |
| BO-DOCUMENT-EXPIRY-WARNINGS | - | Y | Y | - | - | Y | - | - | Y | - | - | Expired Trade License / ID document warning triggers |
| BO-AUTHORISED-SIGNATORY-BOARD-RESOLUTION | Y | - | - | Y | Y | Y | - | - | Y | - | - | Board Resolution document upload & signatory authorization |
| BO-FREEZONE-VS-MAINLAND-SELECTION | - | - | Y | Y | - | Y | - | - | Y | - | - | Freezone vs Mainland UAE entity type selection |
| BO-INDUSTRY-SPECIFIC-LICENSE-CHECKS | - | - | Y | Y | - | Y | - | - | Y | - | - | Industry-specific license validation (Airlines, Logistics) |
| BO-SETTLEMENT-PENNY-DROP-VERIFICATION | Y | - | - | Y | - | Y | Y | - | Y | - | Y | Penny-drop verification for settlement account |
| BO-BUYER-CREDIT-LIMIT-REQUEST | Y | - | - | Y | Y | Y | - | - | Y | - | - | Buyer credit limit & Net 30/60/90 payment term requests |
| BO-REFERRAL-PROMO-CODE-APPLY | - | - | Y | - | - | Y | Y | - | Y | - | - | Referral & partner promo code validation |
| BO-STATUS-INFO-REQUESTED-RESUBMIT | Y | - | - | Y | Y | Y | Y | Y | Y | - | Y | Handling Backoffice info request & document re-upload |
| BO-PARTIAL-DRAFT-SAVING-PERSISTENCE | Y | - | - | Y | - | Y | - | Y | Y | - | - | Explicit Save Draft & multi-session draft resume |


