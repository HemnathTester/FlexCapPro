import { test } from '../../fixtures/base';

test('UA-LOGIN-EXPIRED-OTP-REJECTED Expired OTP is rejected; a new OTP can be requested', async () => {
  test.fixme(
    true,
    'Cannot be executed as designed: the dev team fixed the login OTP to a static test value (STATIC_OTP), so there is no real ' +
      'emailed code with a validity window to wait out any more. Ask the dev team whether the static test OTP still expires ' +
      'server-side after a fixed period, or is valid indefinitely; rewrite once confirmed.',
  );
});
