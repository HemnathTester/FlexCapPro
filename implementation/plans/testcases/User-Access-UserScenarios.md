# User Access — End-to-End User Scenarios

Plain-language journeys for non-technical reviewers. No scripts needed to read this. Each approach names the automated scenarios that check it.
Environment: UAT only. A person running the suite types the OTP codes and clicks "Verify Your Email" when the run asks.

## Approach 1: A new supplier or buyer joins
1. Someone opens the sign-up page and chooses **Supplier** or **Buyer**.
2. They enter the business name, phone number, email and a password (twice), and press **Sign Up**.
3. A message says a verification email was sent, with the address partly hidden.
4. They open the email and press **Verify Email**, then **Verify your email** on the page that opens.
5. The page says the business e-mail has been verified and offers **Log back in**.

Checked by: `UA-REG-SUPPLIER-VALID-REGISTRATION`, `UA-REG-BUYER-VALID-REGISTRATION`.

## Approach 2: Someone makes a mistake while signing up
1. They leave fields empty, or type an email that is not an email. The page asks for what is missing and does not create an account.
2. They choose a weak password, or the two passwords differ. The page refuses.
3. They use an email that is already registered, in capitals, with spaces around it, or under the other role. The page must refuse and say why.
4. They type a very long business name, or a phone number with letters or far too many digits. The page must stop it, never accept it.
5. They click **Sign Up** twice quickly. Only one account and one email must result.

Checked by: `UA-REG-REQUIRED-FIELDS-AND-EMAIL-FORMAT`, `UA-REG-PASSWORD-RULES`, `UA-REG-DUPLICATE-EMAIL`, `UA-REG-FIELD-LENGTH-LIMITS`, `UA-REG-DOUBLE-CLICK-SIGNUP`.

## Approach 3: Someone tries to attack the sign-up or the verification link
1. They paste code-like text (script or database commands) into the form. Nothing may run, and nothing may break.
2. They change a few characters of the verification link. It must not verify the account.
3. They use the real link twice. The second time must not succeed again.
4. They press **Resend** in the pop-up. A second email should arrive (this is a known problem today).

Checked by: `UA-REG-INJECTION-STRINGS`, `UA-REG-VERIFY-LINK-ONCE-AND-TAMPERED`, `UA-REG-RESEND-VERIFICATION-EMAIL`.

## Approach 4: A verified user logs in
1. They enter email and password and press **Login**.
2. A six-digit code is emailed to them. They enter it and press **Verify**.
3. A brand-new business lands on the onboarding guide ("Welcome to AmpliFi"). A business that has finished onboarding would land on its dashboard.
4. They press **Log out**. They are back at the login page, and pressing Back does not return them inside.

Checked by: `UA-LOGIN-SUPPLIER-VALID-LOGIN-OTP`, `UA-LOGIN-BUYER-VALID-LOGIN-OTP`, `UA-LOGIN-NEW-USER-GOES-TO-ONBOARDING`, `UA-LOGIN-LOGOUT-ENDS-SESSION`.

## Approach 5: Someone who should not get in tries to
1. A wrong password and an unknown email give the same message, so nobody can learn which emails are registered.
2. Someone who never verified their email is told to verify, not told their password is wrong.
3. A wrong code is refused. An expired code is refused.
4. After five wrong passwords the account locks, even for the right password. Repeated wrong codes also lock.
5. Typing directly into the address of a protected page while signed out sends them to the login page.

Checked by: `UA-LOGIN-WRONG-PASSWORD-UNKNOWN-EMAIL-EMPTY`, `UA-LOGIN-UNVERIFIED-ACCOUNT-PROMPT`, `UA-LOGIN-WRONG-OTP-REJECTED`, `UA-LOGIN-EXPIRED-OTP-REJECTED`, `UA-LOGIN-LOCKOUT-AFTER-WRONG-PASSWORDS`, `UA-LOGIN-LOCKOUT-AFTER-WRONG-OTPS`, `UA-LOGIN-ROUTE-GUARD-SIGNED-OUT`.

## Approach 6: The code boxes behave sensibly
1. **Verify** stays greyed out until all six digits are in.
2. Letters and symbols do not go in. Pasting a whole code fills every box.
3. **Resend** is unavailable while the countdown runs, then works. After a resend, the old code no longer works.
4. After about 30 minutes without activity the user is signed out.

Checked by: `UA-LOGIN-OTP-INPUT-AND-RESEND-RULES`, `UA-LOGIN-SESSION-TIMEOUT` (only runs on request, because it takes over 30 minutes).

## Approach 7: Someone forgot their password
1. On the login page they press **Forgot Password?**, enter their email and press **Submit**. The page then asks for a code. (The page text says "link" but a code is sent: a wording mistake to report.)
2. They enter the six-digit code from the "Forgot Password OTP" email and press **Verify**.
3. They choose a new password and confirm it. The new password works at login. The old one does not.
4. The same answer is given whether or not the email is registered, so nobody can learn who has an account.

Checked by: `UA-FP-FULL-RESET-BY-OTP`, `UA-FP-UNKNOWN-AND-INVALID-EMAIL`.

## Approach 8: The password reset is abused
1. A wrong code does not open the new-password step. A code that was already used cannot be used again.
2. Asking for a new code cancels the earlier one.
3. Without the real code the new-password step never appears.
4. The new password must follow the rules and cannot be the old password.
5. Asking for codes over and over for one email must be slowed down, so nobody can flood someone's inbox.

Checked by: `UA-FP-WRONG-AND-USED-OTP-REJECTED`, `UA-FP-NEW-REQUEST-INVALIDATES-OLD-OTP`, `UA-FP-CHANGE-PASSWORD-NEEDS-VALID-OTP`, `UA-FP-NEW-PASSWORD-RULES`, `UA-FP-REUSE-OLD-PASSWORD`, `UA-FP-RATE-LIMIT`.

## Not yet covered
- **Switching between roles or businesses** (`UA-LOGIN-ROLE-SWITCH`) and **updating a profile** (`UA-LOGIN-PROFILE-UPDATE`): blocked until UAT has an account with more than one role and a profile screen that can be reached.
- **Landing on the dashboard** after login: needs a business that has completed onboarding.
