# Business Onboarding — User Scenarios (End-to-End Journeys)

Plain-language end-to-end user journeys for non-technical review (RULES.md §3.6).

---

### Journey 1: A New Supplier Completes Business Onboarding
**Goal:** A newly registered Supplier completes entity verification to unlock invoice submission and payment settlement features.

- **Approach:**
  1. The Supplier logs in for the first time after email verification and is routed automatically to the Onboarding Wizard.
  2. On **Step 1 (Business Profile)**, the Supplier provides their legal business name, trade name, trade license number, and tax registration number.
  3. On **Step 2 (Key Contacts)**, the Supplier enters details for the primary business administrator and authorized signatory.
  4. On **Step 3 (Settlement Bank)**, the Supplier selects their local bank and enters their corporate IBAN and account number.
  5. On **Step 4 (Documents)**, the Supplier uploads PDF copies of their Trade License and Director Passport/EID.
  6. On **Step 5 (Review & Declaration)**, the Supplier reviews all summary cards, agrees to the platform terms, and submits.
- **Outcome:** The Supplier sees a confirmation screen ("Application Under Review"). Re-logging in displays the pending verification status until approved by Backoffice.

---

### Journey 2: A New Buyer Configures Business & Settlement Profile
**Goal:** A newly registered Buyer completes onboarding to connect corporate payment cards and initiate supplier relationships.

- **Approach:**
  1. The Buyer logs into the portal and lands on the Onboarding Wizard.
  2. The Buyer fills in organisation details, commercial registration numbers, and financial contact emails.
  3. The Buyer completes bank/card verification setup and uploads corporate authorization documents.
  4. Upon reviewing the summary, the Buyer submits the onboarding application.
- **Outcome:** Application is submitted for compliance review; Buyer receives an email notification confirming submission.

---

### Journey 3: A User Corrects Invalid Inputs & Overcomes Validation Blocks
**Goal:** Ensure a user making mistakes during onboarding receives immediate, clear feedback to correct their entries without losing progress.

- **Approach:**
  1. A user accidentally skips mandatory fields or enters an invalid 3-digit Tax ID.
  2. Clicking "Next" highlights the exact fields with red inline error messages explaining what is wrong.
  3. The user corrects the Tax ID to a valid 15-digit number and enters the missing trade license.
  4. Clicking "Next" now successfully moves the user to the next step.
- **Outcome:** Invalid entries are blocked early; valid corrections allow smooth progression.

---

### Journey 4: Resiliency Against Unexpected Interruptions
**Goal:** A user experiencing a page refresh or back button navigation does not lose previously entered form details.

- **Approach:**
  1. A user fills out Step 1 and Step 2 of the onboarding wizard.
  2. The user accidentally hits F5 (Page Refresh) or clicks the browser's Back button.
  3. The system restores the user's progress or prompts draft recovery.
- **Outcome:** The user easily completes Step 3 and submits without having to re-type Step 1 data.
