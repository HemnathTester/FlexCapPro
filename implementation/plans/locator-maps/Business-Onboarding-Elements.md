# Business Onboarding — Element Map

Cached locator mapping for Business Onboarding wizard screens (RULES.md §3.2b).

| Element Name | Primary Selector / Strategy | Description / Usage |
|--------------|-----------------------------|---------------------|
| Onboarding Header | `h2:has-text("Business Onboarding")`, `.onboarding-header` | Wizard page title indicator |
| Step 1 Indicator | `.step-item:nth-child(1)`, `[data-step="1"]` | Business Details step tab |
| Step 2 Indicator | `.step-item:nth-child(2)`, `[data-step="2"]` | Key Contacts & Directors step tab |
| Step 3 Indicator | `.step-item:nth-child(3)`, `[data-step="3"]` | Bank & Settlement Details step tab |
| Step 4 Indicator | `.step-item:nth-child(4)`, `[data-step="4"]` | Document Upload step tab |
| Step 5 Indicator | `.step-item:nth-child(5)`, `[data-step="5"]` | Review & Submit step tab |
| Legal Business Name | `#legalNameInput`, `input[name="legalName"]` | Official registered business name |
| Trade / DB Name | `#tradeNameInput`, `input[name="tradeName"]` | Doing Business As name |
| Trade License Number | `#tradeLicenseNumberInput`, `input[name="tradeLicenseNumber"]` | Trade License / Registration # |
| Tax / VAT ID Number | `#vatNumberInput`, `input[name="vatNumber"]` | Tax Registration Number (TRN) |
| Country Select | `#countrySelect`, `select[name="country"]` | Dropdown for country of incorporation |
| Address Line 1 | `#addressLine1Input`, `input[name="addressLine1"]` | Registered business address |
| Contact Name | `#contactNameInput`, `input[name="contactName"]` | Primary contact person name |
| Contact Email | `#contactEmailInput`, `input[name="contactEmail"]` | Primary contact email address |
| Contact Phone | `#contactPhoneInput`, `input[name="contactPhone"]` | Primary contact phone number |
| Bank Name Select | `#bankNameSelect`, `select[name="bankName"]` | Settlement bank name dropdown |
| Account Number | `#accountNumberInput`, `input[name="accountNumber"]` | Bank account number |
| IBAN Number | `#ibanInput`, `input[name="iban"]` | IBAN format string |
| SWIFT / BIC Code | `#swiftCodeInput`, `input[name="swiftCode"]` | Bank SWIFT / BIC identifier |
| File Input - Trade License | `#tradeLicenseFileUpload`, `input[type="file"][name="tradeLicense"]` | Document upload for Trade License |
| File Input - Passport/EID | `#passportFileUpload`, `input[type="file"][name="passport"]` | Document upload for Director ID |
| Next Step Button | `button:has-text("Next")`, `button.btn-next` | Advance to next wizard step |
| Back Step Button | `button:has-text("Back")`, `button.btn-back` | Return to previous wizard step |
| Submit Application Button | `button:has-text("Submit Application")`, `button.btn-submit` | Final submission button |
| Inline Error Message | `.invalid-feedback`, `.error-message` | Field validation error text |
| Success Submission Alert | `.submission-success`, `h3:has-text("Under Review")` | Post-submission confirmation modal/screen |
