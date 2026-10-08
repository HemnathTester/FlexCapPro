# Business Onboarding — Test Cases

Fixed-format test case document for the Business Onboarding module (RULES.md §3.4).

---

### TC-BO-SUPPLIER-VALID-ONBOARDING — Valid Supplier Business Onboarding
- Priority: High
- Type: Positive
- Preconditions: User registered as Supplier, email verified, logged in, landed on `/onboarding`.
- Test Data: Legal Name: "UA Supplier Trading LLC", Trade License: "TL-998811", Tax ID: "100998877660003", IBAN: "AE210330000012345678901".
- Steps:
  1. Enter Step 1: Fill Legal Business Name, Trade Name, Trade License #, TRN/Tax ID, and select Country of Incorporation. Click "Next".
  2. Enter Step 2: Fill Primary Contact Name, Designation, Authorized Signatory Email, and Mobile Number. Click "Next".
  3. Enter Step 3: Select Settlement Bank, enter Account Number, IBAN, and SWIFT Code. Click "Next".
  4. Enter Step 4: Upload Trade License copy (.pdf) and Director Emirates ID (.pdf). Click "Next".
  5. Enter Step 5: Review all entered information, check Declaration checkbox, and click "Submit Application".
- Expected Result: Application is submitted successfully; confirmation popup shows "Application Under Review" and status updates to Pending Approval.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-SUPPLIER-VALID-ONBOARDING.spec.ts`
- Notes: Validates happy path for Supplier onboarding wizard end-to-end.

---

### TC-BO-BUYER-VALID-ONBOARDING — Valid Buyer Business Onboarding
- Priority: High
- Type: Positive
- Preconditions: User registered as Buyer, email verified, logged in, landed on `/onboarding`.
- Test Data: Legal Name: "UA Buyer Logistics LLC", Trade License: "TL-774411", TRN: "100774433220003", IBAN: "AE440330000098765432109".
- Steps:
  1. Enter Step 1: Fill Buyer Legal Name, Trade Name, Trade License #, and Tax ID. Click "Next".
  2. Enter Step 2: Fill Key Finance Contact Name, Designation, Email, and Phone. Click "Next".
  3. Enter Step 3: Select Payment Method & Bank settlement details. Click "Next".
  4. Enter Step 4: Upload Certificate of Incorporation (.pdf) and Authorized Signatory ID. Click "Next".
  5. Enter Step 5: Review data, tick Terms & Conditions, and click "Submit Application".
- Expected Result: Onboarding completes with "Application Submitted Successfully" banner and routes user to Dashboard preview or Pending state.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-BUYER-VALID-ONBOARDING.spec.ts`
- Notes: Validates happy path for Buyer onboarding wizard end-to-end.

---

### TC-BO-WIZARD-STEP-NAVIGATION — Wizard Navigation & Draft State Preservation
- Priority: Medium
- Type: Positive
- Preconditions: User on Step 2 or 3 of onboarding wizard with partially filled fields.
- Test Data: Step 1 filled with "UA Nav Test LLC".
- Steps:
  1. On Step 2, click the "Back" button.
  2. Verify user returns to Step 1 and previous data ("UA Nav Test LLC") remains populated.
  3. Click "Next" to advance back to Step 2.
  4. Verify Step indicators accurately highlight the current active step.
- Expected Result: Back and Next buttons navigate correctly between steps without wiping entered field values.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-WIZARD-STEP-NAVIGATION.spec.ts`
- Notes: Verifies step transitions and form state preservation.

---

### TC-BO-MANDATORY-FIELDS-AND-INLINE-ERRORS — Empty Mandatory Field Validation
- Priority: High
- Type: Negative
- Preconditions: User on Step 1 of onboarding wizard.
- Test Data: Empty fields.
- Steps:
  1. Leave Legal Name, Trade License Number, and TRN blank.
  2. Click "Next".
- Expected Result: Navigation to Step 2 is blocked; inline red validation messages appear under required fields (e.g., "Legal Name is required", "Trade License Number is required").
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-MANDATORY-FIELDS-AND-INLINE-ERRORS.spec.ts`
- Notes: Validates required field enforcement.

---

### TC-BO-INVALID-FORMATS-AND-TAX-ID — Format Validation for TRN, IBAN, and Phone
- Priority: High
- Type: Negative
- Preconditions: User on onboarding wizard.
- Test Data: TRN: "123", IBAN: "INVALID_IBAN_123", Contact Phone: "abc".
- Steps:
  1. Enter non-compliant Tax ID ("123") and invalid IBAN ("INVALID_IBAN_123").
  2. Click "Next".
- Expected Result: Form submission is rejected with explicit format errors: "TRN must be 15 digits", "Invalid IBAN structure".
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-INVALID-FORMATS-AND-TAX-ID.spec.ts`
- Notes: Validates strict format rules for financial and tax identifiers.

---

### TC-BO-DUPLICATE-BUSINESS-REGISTRATION — Duplicate Trade License & Tax ID Rejection
- Priority: High
- Type: Negative
- Preconditions: An existing business is already registered with Trade License "TL-EXISTING-100".
- Test Data: Trade License: "TL-EXISTING-100".
- Steps:
  1. Fill Step 1 using Trade License "TL-EXISTING-100".
  2. Click "Next" or attempt step submission.
- Expected Result: System rejects submission with error banner: "A business with this Trade License / TRN is already registered."
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-DUPLICATE-BUSINESS-REGISTRATION.spec.ts`
- Notes: Ensures duplicate business profiles cannot be onboarded.

---

### TC-BO-DOCUMENT-UPLOAD-INVALID-TYPES — Document Type & File Size Enforcement
- Priority: Medium
- Type: Negative
- Preconditions: User on Step 4 (Document Upload).
- Test Data: File `malicious_script.exe`, oversized file `large_doc_50MB.pdf`.
- Steps:
  1. Attempt to upload `malicious_script.exe` as Trade License copy.
  2. Attempt to upload a 50MB file.
- Expected Result: Upload fails immediately with error: "File type not supported. Please upload PDF, PNG, or JPG", "File size exceeds 10MB limit".
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-DOCUMENT-UPLOAD-INVALID-TYPES.spec.ts`
- Notes: Validates file type and size upload security controls.

---

### TC-BO-FIELD-LENGTH-LIMITS-AND-SPECIAL-CHARS — Field Boundaries & Special Characters
- Priority: Medium
- Type: Edge
- Preconditions: User on Step 1 of onboarding wizard.
- Test Data: Business Name with 255 chars, special chars `<script>alert(1)</script>`, leading/trailing spaces.
- Steps:
  1. Enter Legal Name exceeding max length (255+ characters).
  2. Enter special characters `<script>` and leading/trailing spaces `"  Trimmed LLC  "`.
  3. Advance step and verify sanitization.
- Expected Result: Input is truncated to max length limit; HTML/script tags are sanitized or rendered inertly; spaces are trimmed.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-FIELD-LENGTH-LIMITS-AND-SPECIAL-CHARS.spec.ts`
- Notes: Validates XSS protection and boundary limits.

---

### TC-BO-WIZARD-PAGE-REFRESH-AND-BACK — Browser Refresh & Unsaved Draft Recovery
- Priority: Medium
- Type: Edge
- Preconditions: User on Step 3 of onboarding wizard with partial data entered.
- Test Data: Partial bank details filled.
- Steps:
  1. Press browser Refresh (F5 / Cmd+R).
  2. Observe page state and entered data.
  3. Click browser Back button.
- Expected Result: Session restores user to current onboarding step or saved draft state without crashing or corrupting progress.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-WIZARD-PAGE-REFRESH-AND-BACK.spec.ts`
- Notes: Validates resilience against accidental page reload or back button clicks.

---

### TC-BO-SESSION-TIMEOUT-DURING-ONBOARDING — Inactivity Timeout During Onboarding
- Priority: Low
- Type: Edge
- Preconditions: User logged in and idle on Step 2 of onboarding wizard.
- Test Data: Inactivity period.
- Steps:
  1. Leave onboarding wizard idle past the session timeout window.
  2. Attempt to click "Next".
- Expected Result: System prompts session expired notice and redirects user to Login screen safely.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-SESSION-TIMEOUT-DURING-ONBOARDING.spec.ts`
- Notes: Tagged `@slow`. Validates session security during multi-step wizards.

---

### TC-BO-E2E-CRITICAL-REGRESSION-FLOW — End-to-End Business Onboarding Critical Regression
- Priority: High
- Type: Positive
- Preconditions: Clean user account registered and email verified.
- Test Data: Valid Supplier onboarding payload.
- Steps:
  1. Execute full wizard flow (Steps 1 through 5).
  2. Submit application.
  3. Verify application status transitions to Pending Approval.
  4. Log out and log back in.
  5. Verify user is routed to Pending Approval status screen (not back to blank wizard or error page).
- Expected Result: Critical end-to-end regression flow passes cleanly; existing access guards and profile routes remain functional.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-E2E-CRITICAL-REGRESSION-FLOW.spec.ts`
- Notes: Core regression gate for Business Onboarding functionality.

---

### TC-BO-UBO-PEP-DECLARATIONS — Ultimate Beneficial Owner & PEP Declarations
- Priority: High
- Type: Edge
- Preconditions: User on Step 2 (Shareholders & UBOs) of onboarding wizard.
- Test Data: UBO Name: "Alexander Wright", Ownership: 30%, PEP Checkbox: checked.
- Steps:
  1. Add shareholder details with >25% equity ownership.
  2. Select PEP declaration checkbox.
  3. Enter PEP detail explanation text ("Family member in government role").
  4. Advance to Next step.
- Expected Result: UBO details are accepted; PEP declaration requires mandatory explanation before advancing.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-UBO-PEP-DECLARATIONS.spec.ts`
- Notes: Validates compliance & AML requirements.

---

### TC-BO-DOCUMENT-EXPIRY-WARNINGS — Expired Trade License / ID Document Warning Triggers
- Priority: High
- Type: Negative
- Preconditions: User on Step 4 (Documents Upload).
- Test Data: Expired Trade License document / date.
- Steps:
  1. Upload Trade License with an expiry date set in the past (e.g., 2020-01-01).
  2. Click "Next".
- Expected Result: System blocks upload or displays warning banner: "Trade License has expired. Please upload a valid document."
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-DOCUMENT-EXPIRY-WARNINGS.spec.ts`
- Notes: Prevents submission of invalid/expired legal documentation.

---

### TC-BO-AUTHORISED-SIGNATORY-BOARD-RESOLUTION — Board Resolution Upload & Signatory Verification
- Priority: Medium
- Type: Positive
- Preconditions: User on Step 2 or 4 of onboarding wizard.
- Test Data: Board Resolution PDF document.
- Steps:
  1. Select "Authorized Signatory" role for primary contact.
  2. Upload Board Resolution letter authorizing the signatory.
  3. Advance to Next step.
- Expected Result: Document is attached successfully; signatory authorization is recorded.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-AUTHORISED-SIGNATORY-BOARD-RESOLUTION.spec.ts`
- Notes: Verifies corporate authorization checks.

---

### TC-BO-FREEZONE-VS-MAINLAND-SELECTION — Freezone vs Mainland Entity Setup Variations
- Priority: Medium
- Type: Edge
- Preconditions: User on Step 1 of onboarding wizard.
- Test Data: Entity Type: "Freezone (DMCC)".
- Steps:
  1. Select Entity Type dropdown = "Freezone".
  2. Select Freezone Authority = "DMCC".
  3. Verify Freezone-specific license inputs appear.
- Expected Result: Dynamic form fields update correctly based on Freezone vs Mainland selection.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-FREEZONE-VS-MAINLAND-SELECTION.spec.ts`
- Notes: Validates UAE-specific business structure variations.

---

### TC-BO-INDUSTRY-SPECIFIC-LICENSE-CHECKS — Industry License Validations
- Priority: Medium
- Type: Edge
- Preconditions: User on Step 1 of onboarding wizard.
- Test Data: Industry Sector: "Airlines / Aviation".
- Steps:
  1. Select Industry = "Airlines".
  2. Verify IATA / Airline Operator license input field becomes mandatory.
  3. Fill valid IATA code and proceed.
- Expected Result: Industry-specific mandatory license fields are displayed and validated properly.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-INDUSTRY-SPECIFIC-LICENSE-CHECKS.spec.ts`
- Notes: Validates industry sector specific onboarding requirements.

---

### TC-BO-SETTLEMENT-PENNY-DROP-VERIFICATION — Penny Drop Verification for Settlement Bank
- Priority: High
- Type: Positive
- Preconditions: User on Step 3 (Settlement Bank Details).
- Test Data: Corporate IBAN.
- Steps:
  1. Enter corporate settlement bank IBAN.
  2. Click "Verify Account / Penny Drop".
  3. Enter 6-digit penny-deposit micro-verification code.
- Expected Result: Bank account status updates to "Verified" with green badge indicator.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-SETTLEMENT-PENNY-DROP-VERIFICATION.spec.ts`
- Notes: Verifies financial account ownership verification.

---

### TC-BO-BUYER-CREDIT-LIMIT-REQUEST — Buyer Credit Limit & Payment Terms Request
- Priority: Medium
- Type: Positive
- Preconditions: User registered as Buyer on Step 3 of onboarding wizard.
- Test Data: Requested Credit Limit: "$100,000", Requested Terms: "Net 60".
- Steps:
  1. Input Requested Credit Limit amount ($100,000).
  2. Select desired Payment Terms (Net 30 / Net 60).
  3. Submit for financial underwriting review.
- Expected Result: Credit limit request is attached to Buyer application for Backoffice evaluation.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-BUYER-CREDIT-LIMIT-REQUEST.spec.ts`
- Notes: Validates Buyer credit assessment parameters.

---

### TC-BO-REFERRAL-PROMO-CODE-APPLY — Referral & Partner Code Validation
- Priority: Low
- Type: Edge
- Preconditions: User on Step 1 or Step 5 of onboarding wizard.
- Test Data: Referral Code: "PARTNER2026".
- Steps:
  1. Enter Referral / Promo Code "PARTNER2026".
  2. Click "Apply".
- Expected Result: System displays "Referral code applied: 10% Fee Discount" or invalid code error banner if incorrect.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-REFERRAL-PROMO-CODE-APPLY.spec.ts`
- Notes: Validates growth & referral program integrations.

---

### TC-BO-STATUS-INFO-REQUESTED-RESUBMIT — Backoffice Clarification & Document Re-submission
- Priority: High
- Type: Positive
- Preconditions: Onboarding application in "Info Requested" / "Clarification Needed" status.
- Test Data: Corrected Trade License PDF.
- Steps:
  1. User logs in and sees "Clarification Requested by Backoffice: Please re-upload Trade License".
  2. Click "Update Application".
  3. Re-upload corrected Trade License PDF.
  4. Click "Re-submit Application".
- Expected Result: Status updates back to "Under Review"; updated document is linked to application.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-STATUS-INFO-REQUESTED-RESUBMIT.spec.ts`
- Notes: Validates clarification & re-submission workflow.

---

### TC-BO-PARTIAL-DRAFT-SAVING-PERSISTENCE — Explicit Save Draft & Multi-Session Resume
- Priority: Medium
- Type: Positive
- Preconditions: User on Step 2 of onboarding wizard.
- Test Data: Partial company information.
- Steps:
  1. Fill Step 1 and Step 2 fields.
  2. Click "Save Draft & Exit".
  3. Log out.
  4. Log back in on a different browser session.
- Expected Result: User is prompted "Resume your saved onboarding draft?", and clicking Yes restores all Step 1 and Step 2 fields.
- Automation script path: `source/web/chrome/specs/business-onboarding/BO-PARTIAL-DRAFT-SAVING-PERSISTENCE.spec.ts`
- Notes: Validates explicit draft saving across sessions.

