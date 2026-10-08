# User Access — Test Cases

- **Module:** user-access (Register, Login, Forgot Password)
- **Criticality:** **Critical** (identity). It blocks every other module because nothing else is reachable without an account and a login.
- **Environment:** UAT only. Portal `https://uat.freightpay.flexcappro.com`. Screens captured live on 2026-10-06 (see `locator-maps/User-Access-Elements.md`).
- **Sources:** PRD v1.4 (REQ-UM-001..009, BR-021, BR-022, BR-024), the Register / Login / Forgot Password tabs of the existing manual suite (reference only), and the live UAT screens.
- **Scenario list and coverage reasoning:** `scenario-catalog.md`, `coverage-model.md`. 33 scenarios: 8 Positive, 6 Negative, 19 Edge.
- **Mail and OTP:** the person running the suite types every OTP and clicks "Verify Your Email" (the run names the mailbox). See `module-plans/User-Access-Plan.md`.

Common test data: password `Test@1234` (policy-valid), dummy UAE mobile numbers, throwaway mailboxes `ua.<what>.<time>@yopmail.com`.
Main accounts: `supplier1000@yopmail.com`, `buyer1000@yopmail.com`. They land on **Onboarding** after login (not a Dashboard) because they are not onboarded.
Accounts that get locked or reset are always throwaway ones, never the main accounts.

---

## Register

### TC-UA-REG-SUPPLIER-VALID-REGISTRATION — Register a Supplier with all valid mandatory fields
- **Priority:** High. **Type:** Positive
- **Preconditions:** `supplier1000@yopmail.com` not yet registered (otherwise a throwaway email is used).
- **Test Data:** Business Name "Supplier Trading LLC", +971, dummy phone, email, `Test@1234` in both password fields.
- **Steps:**
  1. Open `/signup`, keep the **Supplier** tab.
  2. Fill the five fields and click **Sign Up**.
  3. Read the pop-up. Open the mailbox and read the email. Click **Verify Email**, then **Verify your email →**.
- **Expected Result:** API 200 "User created successfully." Pop-up "Verification Email Sent!" with a masked email. Email "Verify Your Email" from Freightpay with a Verify Email button (link expires in 24 hours). After verifying: "Your business e-mail has been verified".
- **Automation script:** `source/web/chrome/specs/user-access/UA-REG-SUPPLIER-VALID-REGISTRATION.spec.ts`
- **Notes:** REQ-UM-001, REQ-UM-009 (plain Supplier/Buyer labels are what UAT shows).

### TC-UA-REG-BUYER-VALID-REGISTRATION — Register a Buyer with all valid mandatory fields
- **Priority:** High. **Type:** Positive
- **Preconditions:** `buyer1000@yopmail.com` not yet registered (otherwise a throwaway email).
- **Test Data:** as above, **Buyer** tab.
- **Steps:** as the Supplier case, choosing the **Buyer** tab first.
- **Expected Result:** same as the Supplier case.
- **Automation script:** `.../UA-REG-BUYER-VALID-REGISTRATION.spec.ts`
- **Notes:** REQ-UM-001.

### TC-UA-REG-REQUIRED-FIELDS-AND-EMAIL-FORMAT — Empty mandatory fields and invalid email formats
- **Priority:** High. **Type:** Negative
- **Preconditions:** none.
- **Test Data:** emails `plainaddress`, `missing-at.yopmail.com`, `two@@yopmail.com`, `spaces in@yopmail.com`, `@yopmail.com`, `user@`, `user@yopmail`.
- **Steps:**
  1. Open `/signup`, click **Sign Up** with everything empty.
  2. For each bad email, fill valid values elsewhere and click **Sign Up**.
- **Expected Result:** "Business Name is required.", "Mobile Number is required.", "Email is required.", "Password is required.", "Confirm Password is required." No request is sent. A bad email gives a visible email error, no pop-up, no account.
- **Automation script:** `.../UA-REG-REQUIRED-FIELDS-AND-EMAIL-FORMAT.spec.ts`
- **Notes:** manual TC_REG_AIR_07/08.

### TC-UA-REG-DUPLICATE-EMAIL — Duplicate email is refused
- **Priority:** High. **Type:** Edge
- **Preconditions:** a verified throwaway account exists (the scenario creates it).
- **Test Data:** same email; upper-case email; email with spaces around it; same email under the other role tab.
- **Steps:** try to register each variant and watch the page for 2.5 seconds.
- **Expected Result:** never accepted (no 200, no pop-up) and the user is told why ("already exists" / "registered").
- **Automation script:** `.../UA-REG-DUPLICATE-EMAIL.spec.ts`
- **Notes:** the server answers 400 "User already exists in Keycloak with email: ..." but an earlier read of the page showed no message. This scenario checks that a user-visible message exists (likely finding).

### TC-UA-REG-PASSWORD-RULES — Password policy and confirm mismatch
- **Priority:** High. **Type:** Negative
- **Test Data:** `Ab1!` (short), `test@1234` (no upper), `TEST@1234` (no lower), `Test@abcd` (no digit), `Test12345` (no special), and Password `Test@1234` with Confirm `Test@12345`.
- **Steps:** fill a unique email and each password, click **Sign Up**.
- **Expected Result:** never accepted; a visible password-related message.
- **Automation script:** `.../UA-REG-PASSWORD-RULES.spec.ts`
- **Notes:** manual TC_REG_AIR_10/11. Passed in the first run.

### TC-UA-REG-FIELD-LENGTH-LIMITS — Field length limits
- **Priority:** Medium. **Type:** Edge
- **Test Data:** Business Name of 300 characters; phone `abcdefghi`, `50-123#4567`, `123`, 20 digits.
- **Steps:** fill each value and click **Sign Up**.
- **Expected Result:** each invalid value is stopped in the field itself or rejected with a visible message. Never accepted, never a server error.
- **Automation script:** `.../UA-REG-FIELD-LENGTH-LIMITS.spec.ts`
- **Notes:** first run found the 300-character name and the 20-digit phone were ACCEPTED (likely findings). Dummy numbers only.

### TC-UA-REG-INJECTION-STRINGS — Script and SQL text in fields
- **Priority:** High. **Type:** Edge
- **Test Data:** `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>`, `'; DROP TABLE users; --`, `' OR '1'='1` as Business Name.
- **Steps:** submit each with a unique email.
- **Expected Result:** rejected, or stored as plain text. No script runs, no raw tag reflected, no server error.
- **Automation script:** `.../UA-REG-INJECTION-STRINGS.spec.ts`
- **Notes:** manual TC_REG_AIR_13. Passed in the first run.

### TC-UA-REG-DOUBLE-CLICK-SIGNUP — Double-click on Sign Up
- **Priority:** Medium. **Type:** Edge
- **Steps:** fill valid data, double-click **Sign Up**, then count verification emails.
- **Expected Result:** exactly one successful registration call and exactly one "Verify Your Email" email.
- **Automation script:** `.../UA-REG-DOUBLE-CLICK-SIGNUP.spec.ts`
- **Notes:** manual TC_REG_AIR_15. The person is asked how many emails arrived.

### TC-UA-REG-VERIFY-LINK-ONCE-AND-TAMPERED — Verify link works once; altered link is refused
- **Priority:** High. **Type:** Edge
- **Steps:**
  1. Register a throwaway account and copy the verify link (do not click it).
  2. Open the link with the token altered: the account must stay unverified (login still asks to verify).
  3. Open the real link and click Verify: account verified, login reaches the OTP step.
  4. Open the same real link again.
- **Expected Result:** altered link never verifies. Real link verifies once. A second use does not show the success message again.
- **Automation script:** `.../UA-REG-VERIFY-LINK-ONCE-AND-TAMPERED.spec.ts`
- **Notes:** manual TC_EMAILVER_01/03/05. Link expiry (24 hours) is not automated.

### TC-UA-REG-RESEND-VERIFICATION-EMAIL — Resend sends a new email (known defect)
- **Priority:** High. **Type:** Negative
- **Steps:** register, click **Resend** in the pop-up, count emails.
- **Expected Result:** a second "Verify Your Email" arrives (two in total).
- **Automation script:** `.../UA-REG-RESEND-VERIFICATION-EMAIL.spec.ts`
- **Notes:** KNOWN DEFECT from the manual run (Resend did nothing). Tagged `@known-defect`.

---

## Login

### TC-UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP — Supplier logs in with password and OTP
- **Priority:** High. **Type:** Positive
- **Preconditions:** `supplier1000@yopmail.com` verified (created by the scenario if missing).
- **Steps:** open `/login`, enter email and `Test@1234`, click **Login**, type the 6-digit OTP from "Your FreightPay Login Code", click **Verify →**.
- **Expected Result:** leaves `/login` and lands on `/airlines/onBoarding` with **Log out** visible.
- **Automation script:** `.../UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP.spec.ts`
- **Notes:** REQ-UM-002. A Dashboard landing needs an onboarded account, which does not exist yet.

### TC-UA-LOGIN-BUYER-VALID-LOGIN-OTP — Buyer logs in with password and OTP
- **Priority:** High. **Type:** Positive. Same as above with `buyer1000@yopmail.com`.
- **Automation script:** `.../UA-LOGIN-BUYER-VALID-LOGIN-OTP.spec.ts`

### TC-UA-LOGIN-NEW-USER-GOES-TO-ONBOARDING — New verified user lands on Onboarding
- **Priority:** High. **Type:** Positive
- **Steps:** create and verify a throwaway account, log in with OTP.
- **Expected Result:** `/airlines/onBoarding`, text "Welcome to AmpliFi", step list starting with "Business Details".
- **Automation script:** `.../UA-LOGIN-NEW-USER-GOES-TO-ONBOARDING.spec.ts`

### TC-UA-LOGIN-WRONG-PASSWORD-UNKNOWN-EMAIL-EMPTY — Wrong password, unknown email, empty form
- **Priority:** High. **Type:** Edge
- **Steps:** log in with a wrong password for a real account; with an unknown email; with the form empty.
- **Expected Result:** both failures give the identical message "Invalid credentials. Please check your email and password." (so accounts cannot be discovered), no OTP step. Empty form sends nothing and flags the email field.
- **Automation script:** `.../UA-LOGIN-WRONG-PASSWORD-UNKNOWN-EMAIL-EMPTY.spec.ts`

### TC-UA-LOGIN-UNVERIFIED-ACCOUNT-PROMPT — Unverified account is asked to verify
- **Priority:** High. **Type:** Negative
- **Steps:** register without verifying, then log in.
- **Expected Result:** the "Verification Email Sent!" prompt, not "Invalid credentials", and no OTP step.
- **Automation script:** `.../UA-LOGIN-UNVERIFIED-ACCOUNT-PROMPT.spec.ts`
- **Notes:** the manual run saw "Invalid credentials" here (KNOWN DEFECT). A UAT probe on 2026-10-06 showed the prompt, so it may be fixed; this scenario will tell.

### TC-UA-LOGIN-WRONG-OTP-REJECTED — Wrong OTP is refused
- **Priority:** High. **Type:** Negative
- **Steps:** log in to the OTP step, enter `000000`, click **Verify →**.
- **Expected Result:** an error message, still on `/login`, no **Log out**, and a protected page still sends the user to Login.
- **Automation script:** `.../UA-LOGIN-WRONG-OTP-REJECTED.spec.ts`

### TC-UA-LOGIN-EXPIRED-OTP-REJECTED — Expired OTP is refused
- **Priority:** High. **Type:** Edge
- **Steps:** log in to the OTP step, read the code, wait past its validity, enter it.
- **Expected Result:** rejected with a message, no session.
- **Automation script:** `.../UA-LOGIN-EXPIRED-OTP-REJECTED.spec.ts`
- **Notes:** the person says how many minutes the email states. If 0 or more than 6, the scenario is reported as not executed (never a false pass). Open question: the Forgot Password API returned an "otpExpiry" of 59 seconds; confirm the real validity.

### TC-UA-LOGIN-LOCKOUT-AFTER-WRONG-PASSWORDS — Lockout after 5 wrong passwords
- **Priority:** High. **Type:** Edge
- **Steps:** five logins with wrong passwords, then one with the correct password.
- **Expected Result:** the correct password is refused (account locked): no OTP step.
- **Automation script:** `.../UA-LOGIN-LOCKOUT-AFTER-WRONG-PASSWORDS.spec.ts`
- **Notes:** BR-022. Throwaway account only.

### TC-UA-LOGIN-LOCKOUT-AFTER-WRONG-OTPS — Lockout after repeated wrong OTPs
- **Priority:** High. **Type:** Edge
- **Steps:** at the OTP step enter six wrong codes, then the correct one.
- **Expected Result:** the correct code is refused.
- **Automation script:** `.../UA-LOGIN-LOCKOUT-AFTER-WRONG-OTPS.spec.ts`
- **Notes:** manual TC_LOGIN_OTP_10. The real limit is not documented, so six attempts are made.

### TC-UA-LOGIN-OTP-INPUT-AND-RESEND-RULES — OTP boxes and Resend
- **Priority:** Medium. **Type:** Edge
- **Steps:** Verify stays disabled with 5 digits and enables with 6; letters/symbols are not accepted; pasting `123456` fills all boxes; "Resend OTP in 00:56" counts down and Resend appears after it; a new code differs from the old and the old code is then refused.
- **Expected Result:** each rule holds.
- **Automation script:** `.../UA-LOGIN-OTP-INPUT-AND-RESEND-RULES.spec.ts`
- **Notes:** manual TC_LOGIN_OTP_03/05/06/11/12/13 (some failed in the manual run).

### TC-UA-LOGIN-ROUTE-GUARD-SIGNED-OUT — Protected pages redirect to Login
- **Priority:** High. **Type:** Edge
- **Steps:** while signed out, open `/airlines/onBoarding`, `/airlines/onboarding`, `/airlines/dashboard`.
- **Expected Result:** each lands on `/login` and never shows protected content.
- **Automation script:** `.../UA-LOGIN-ROUTE-GUARD-SIGNED-OUT.spec.ts`
- **Notes:** REQ-UM-003. Wrong-role and "Dashboard before onboarding" checks wait for an onboarded account and real Dashboard routes.

### TC-UA-LOGIN-SESSION-TIMEOUT — Session expires after inactivity
- **Priority:** Medium. **Type:** Edge
- **Steps:** log in, stay idle 31 minutes, reload.
- **Expected Result:** sent back to `/login`.
- **Automation script:** `.../UA-LOGIN-SESSION-TIMEOUT.spec.ts` (runs only with `--slow`)
- **Notes:** REQ-UM-006, BR-021 (30 minutes). The warning before expiry is not yet checked.

### TC-UA-LOGIN-LOGOUT-ENDS-SESSION — Logout ends the session
- **Priority:** Medium. **Type:** Positive
- **Steps:** log in, click **Log out**, press Back, then open `/airlines/onBoarding`.
- **Expected Result:** `/login` after logout; Back does not show the signed-in page; the protected page redirects to Login.
- **Automation script:** `.../UA-LOGIN-LOGOUT-ENDS-SESSION.spec.ts`

### TC-UA-LOGIN-ROLE-SWITCH — Switch role/business context
- **Priority:** Medium. **Type:** Edge
- **Expected Result:** a user with several roles/businesses can switch and sees only that context's data.
- **Automation script:** `.../UA-LOGIN-ROLE-SWITCH.spec.ts`
- **Notes:** **BLOCKED.** Needs a UAT account with more than one role (REQ-UM-004). Reported as "not executed".

### TC-UA-LOGIN-PROFILE-UPDATE — View and update profile
- **Priority:** Medium. **Type:** Positive
- **Expected Result:** profile changes persist after logging in again.
- **Automation script:** `.../UA-LOGIN-PROFILE-UPDATE.spec.ts`
- **Notes:** **BLOCKED.** No profile screen is reachable before onboarding (the page offers only Log out). Needs an onboarded account (REQ-UM-005).

---

## Forgot Password

UAT sends a **Forgot Password OTP** email (6 digits), although the page says it will send a link. That wording is itself a bug to report.

### TC-UA-FP-FULL-RESET-BY-OTP — Full reset
- **Priority:** High. **Type:** Positive
- **Steps:** on `/login` click **Forgot Password?**, enter the email, **Submit**, type the OTP from "Forgot Password OTP", click **Verify →**, set `New@12345` in both fields and submit, then try to log in with the new and the old password.
- **Expected Result:** reset accepted; the new password reaches the login OTP step; the old password does not.
- **Automation script:** `.../UA-FP-FULL-RESET-BY-OTP.spec.ts`
- **Notes:** change-password locators are generic until the first real run confirms them.

### TC-UA-FP-UNKNOWN-AND-INVALID-EMAIL — Unknown and invalid emails
- **Priority:** High. **Type:** Edge
- **Steps:** submit a registered email and an unknown email; submit empty, `plainaddress`, `a@b`, `two@@yopmail.com`.
- **Expected Result:** known and unknown get the identical response ("If your email is registered, you will receive an OTP shortly."), no "not found" wording; malformed input is not sent.
- **Automation script:** `.../UA-FP-UNKNOWN-AND-INVALID-EMAIL.spec.ts`

### TC-UA-FP-WRONG-AND-USED-OTP-REJECTED — Wrong and already-used OTP
- **Priority:** High. **Type:** Edge
- **Steps:** request an OTP; enter `000000`; then the real OTP and finish the reset; request a new OTP and enter the OLD one.
- **Expected Result:** wrong code does not open the change-password step; the real code does; the used code is refused the second time.
- **Automation script:** `.../UA-FP-WRONG-AND-USED-OTP-REJECTED.spec.ts`

### TC-UA-FP-NEW-PASSWORD-RULES — New password rules
- **Priority:** High. **Type:** Negative
- **Test Data:** the same six weak/mismatch passwords as the Register scenario.
- **Expected Result:** none accepted; each shows a visible message.
- **Automation script:** `.../UA-FP-NEW-PASSWORD-RULES.spec.ts`

### TC-UA-FP-REUSE-OLD-PASSWORD — Reuse of the old password
- **Priority:** Medium. **Type:** Edge
- **Steps:** reach the change-password step and enter the current password.
- **Expected Result:** refused.
- **Automation script:** `.../UA-FP-REUSE-OLD-PASSWORD.spec.ts`
- **Notes:** manual TC_FP_CHANGEPW_08.

### TC-UA-FP-NEW-REQUEST-INVALIDATES-OLD-OTP — A new OTP voids the older one
- **Priority:** Medium. **Type:** Edge
- **Steps:** request an OTP, request another, enter the first code, then the second.
- **Expected Result:** the first is refused, the second opens the change-password step.
- **Automation script:** `.../UA-FP-NEW-REQUEST-INVALIDATES-OLD-OTP.spec.ts`

### TC-UA-FP-CHANGE-PASSWORD-NEEDS-VALID-OTP — No change-password without the OTP
- **Priority:** High. **Type:** Edge
- **Steps:** submit the email; do not open the mailbox; try `000000`, `123456`, `999999`.
- **Expected Result:** no password fields are visible at any point; Verify is disabled until six digits are entered.
- **Automation script:** `.../UA-FP-CHANGE-PASSWORD-NEEDS-VALID-OTP.spec.ts`
- **Notes:** needs no OTP from the person.

### TC-UA-FP-RATE-LIMIT — Rapid repeated requests are throttled
- **Priority:** Medium. **Type:** Edge
- **Steps:** submit Forgot Password for one email eight times in a row.
- **Expected Result:** a throttle appears (HTTP 429 or a clear "too many requests / try again later" message).
- **Automation script:** `.../UA-FP-RATE-LIMIT.spec.ts`
- **Notes:** manual TC_FP_EMAIL_08. The limit is not documented. The check now accepts only a real throttling signal.
