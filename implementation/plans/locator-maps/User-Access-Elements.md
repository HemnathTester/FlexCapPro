# User Access — Locator Map (UAT)

Captured from the live UAT screens on 2026-10-06 (read-only probe plus real flows). Scripts read this first; re-check only when a
screen mismatch is detected at run time (RULES.md §2, §3 rule 2b). Base URL: `https://uat.freightpay.flexcappro.com`.
Registration/login API host: `https://uat.freightpay-middleware.flexcappro.com`.

## Register — `/signup`

| Element | How to find it | Notes |
|---|---|---|
| Role tabs | `getByRole('button', { name: 'Supplier' })` / `{ name: 'Buyer', exact: true }` | Plain labels (matches PRD REQ-UM-009). Supplier selected by default |
| Business Name | `#businessNameInput` | placeholder "Business Name *" |
| Country code | `select` (first on page) | options +973 +968 +974 +377 +971 +966 +965 +1 +33 +32 +41 +31 +353; default +971 |
| Phone Number | `#mobileNumberInput` | placeholder "Phone Number *"; dummy numbers only |
| Organisation Email | `#organisationEmail` | type=email |
| Password / Confirm | `#passwordInput`, `#confirmPasswordInput` | each has an eye toggle (aria-label "Toggle password visibility" / "Toggle confirm password visibility") |
| Sign Up | `getByRole('button', { name: 'Sign Up' })` | type=submit |
| Login link | text "Login" next to "Already a user ?" | |
| Terms link | `a` "terms and conditions" | |
| Required errors | text "Business Name is required.", "Mobile Number is required.", "Email is required.", "Password is required.", "Confirm Password is required." | shown on empty submit; no request sent |
| Success pop-up | text "Verification Email Sent!" | body: "We've sent a verification email to your xxxx****@yopmail.com …"; buttons Close and Resend |
| Registration API | `POST /auth/users` | 200 "User created successfully."; 400 "User already exists in Keycloak with email: …" |

Duplicate email: the server answers 400, and the page showed no message in a post-submit read taken 6 s later (a short-lived toast may exist). UA-REG-DUPLICATE-EMAIL polls for it.

## Verification mail and page

- Mail: subject **Verify Your Email**, sender **Freightpay <noreply@flexcappro.com>**, "Dear <Business Name>", a Verify Email button, "This link will expire in 24 hours."
- Link: `/verify-email?token=…&email=…`. The page shows "We have received an email verification request …" and a **Verify your email →** button.
  The account is verified only after clicking it. Then: "Your business e-mail has been verified" and **Log back in →**.

## Login — `/login`

| Element | How to find it | Notes |
|---|---|---|
| Email | `#emailInput` | placeholder "Registered Email" |
| Password | `#passwordInput` | eye toggle |
| Login | `button[type=submit]` with text "Login" | |
| Create an Account | text link | |
| Forgot Password? | text link (red) | opens the Forgot password view on the same URL |
| Login API | `POST /auth/users/login` | 401 "Invalid credentials. Please check your email and password." |
| Unverified account | pop-up "Verification Email Sent!" again | |

## OTP step (same page, after a correct password)

| Element | How to find it | Notes |
|---|---|---|
| OTP boxes | `input.otp-input` ×6 | ids `otp_0_…` to `otp_5_…`, type=tel, autocomplete=one-time-code |
| Verify | `getByRole('button', { name: /^\s*Verify/ })` | "Verify →"; disabled until all 6 digits are entered |
| Resend | text "Resend OTP in 00:56" (countdown from 60 s), then "Resend OTP" | |
| OTP mail | subject **Your FreightPay Login Code**, 6-digit code in the body | |
| After success | URL `/airlines/onBoarding` for a new account; page text "Hi <Name>! Welcome to AmpliFi!", **Log out** | Onboarding steps: Business Details (Business Info, Commercial License, Articles of Association), Stakeholder Details, Authorized Signatory Details, Bank Account Details, Account Admin, Upload … |

## Forgot Password (on `/login`)

| Element | How to find it | Notes |
|---|---|---|
| Heading | "Forgot password" | text: "Please enter your registered email address below. We'll send you a **link** to reset your password." |
| Email | `#registeredEmail` | placeholder "Registered Email" |
| Submit | `button[type=submit]` "Submit" | |
| Back | text "Back to Login" | |

The reset is link-based, not OTP-based as the manual suite assumed. Reset-page elements are added below once captured.

## Mail reader (yopmail)

`https://yopmail.com/en/wm`: type the inbox in `#login`; list in iframe `#ifinbox` (rows `div.m`, id = message id, `.lmf` sender, `.lms` subject);
message in iframe `#ifmail`. Inboxes are public and shared with other people: only act on mail that is **new** since a snapshot and matches the subject.
Use a separate browser context with images, fonts and ad domains blocked (the page crashes headless Chrome otherwise).
